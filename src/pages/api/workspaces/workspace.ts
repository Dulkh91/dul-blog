import type { APIRoute } from "astro";
import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { db } from "../../../lib/firebase";

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

// GET /api/firebase/expandtracks/workspace?ownerUid=<firebase-uid>
export const GET: APIRoute = async ({ url }) => {
  const ownerUid = url.searchParams.get("ownerUid")?.trim();
  

  try {
    const workspacesRef = collection(db, "workspaces");
    const workspacesQuery = ownerUid
      ? query(workspacesRef, where("ownerUid", "==", ownerUid))
      : query(workspacesRef);
    
    const snapshot = await getDocs(workspacesQuery);

    const workspaces = snapshot.docs.map((doc) => {
      const data = doc.data();
        
      
      return {
        id: doc.id,
        name: data.name ?? "",
        type: data.type ?? "personal",
        currency: data.currency ?? "USD",
        ownerUid: data.ownerUid ?? "",
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? null,
      };
    });

    return json({ workspaces, workspace: workspaces });
  } catch (error) {
    console.error("GET /api/firebase/expandtracks/workspace failed:", error);
    return json({ error: "មិនអាចទាញយក workspace ពី Firebase បានទេ។" }, 500);
  }
};

// POST /api/firebase/expandtracks/workspace
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "ទិន្នន័យមិនត្រឹមត្រូវ។" }, 400);
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const type = typeof body.type === "string" ? body.type.trim() : "personal";
    const currency = typeof body.currency === "string" ? body.currency.trim() : "USD";
    const ownerUid =
      (typeof body.ownerUid === "string" && body.ownerUid.trim()) ||
      locals.user?.id ||
      "anonymous";

    if (!name) {
      return json({ error: "សូមបញ្ចូលឈ្មោះ workspace (name)។" }, 400);
    }

    const newWorkspace = {
      name,
      type,
      currency,
      ownerUid,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "workspaces"), newWorkspace);

    return json(
      {
        success: true,
        message: "បានបង្កើត workspace ដោយជោគជ័យ!",
        workspace: {
          id: docRef.id,
          name,
          type,
          currency,
          ownerUid,
          createdAt: new Date().toISOString(),
        },
      },
      201
    );
  } catch (error) {
    console.error("POST /api/firebase/expandtracks/workspace failed:", error);
    return json({ error: "មិនអាចបង្កើត workspace ទៅ Firebase បានទេ។" }, 500);
  }
};
