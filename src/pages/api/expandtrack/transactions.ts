import type { APIRoute } from "astro";
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
export const prerender = false

const json = (data: unknown, status = 200): Response => {
    return new Response(JSON.stringify(data),{
        status,
        headers: {"Content-Type": "application/json; charset=utf-8"}
    })};

const isDollarCurrency = (currency: string) =>
    ["$", "USD", "US$"].includes(currency.trim().toUpperCase());

const getStoredAmount = (value: unknown, currency: string) => {
    const parsedAmount =
        typeof value === "number"
            ? value
            : typeof value === "string"
              ? Number(value.replace(/,/g, ""))
              : 0;
    const amount = Number.isFinite(parsedAmount) ? parsedAmount : 0;

    return isDollarCurrency(currency)
        ? Math.round((amount + Number.EPSILON) * 100)
        : amount;
};

export const POST: APIRoute = async ({request})=>{

    try {
        const body = await request.json().catch(()=> null)
        if(!body || typeof body !== "object"){
            return json({error: "ទិន្នន័យមិនត្រឹមត្រូវ។"}, 400)
        }


        const title = typeof body.title === "string"? body.title.trim() : "";
        const type = typeof body.type === "string"? body.type.trim(): "EXPENSE";
       
        const currency = typeof body.currency === "string"? body.currency.trim(): "៛";
        const amount = getStoredAmount(body.amount, currency);
        const amountInCents = isDollarCurrency(currency);

        const category = typeof body.category === "string"? body.category.trim(): "";
        const note = typeof body.note === "string"? body.note.trim(): "";

        if (!title) {
            return json({ error: "សូមបញ្ចូលចំណងជើង (title)។" }, 400);
        }

        const transaction = {
            title,
            type,
            amount,
            amountInCents,
            currency,
            category,
            note,
            createdAt: serverTimestamp()
        }

        const transactionRef = await addDoc(collection(db,"transactions"),transaction)

        return json({
            success: true,
            transaction: {
                id: transactionRef.id,
                ...transaction,
                createdAt: new Date().toISOString()
            }
        }, 201)
    } catch (error) {
        console.error("POST transaction failed:", error)
        return json({error:"មិនអាចបង្កើត transaction ក្នុង Firebase បានទេ។" },500)
    }
}

// DELETE /api/expandtrack/transactions?id=<transactionId>
export const DELETE: APIRoute = async ({ request, url }) => {
    try {
        let id = url.searchParams.get("id")?.trim() ?? "";
        if (!id) {
            const body = await request.json().catch(() => null);
            id = typeof body?.id === "string" ? body.id.trim() : "";
        }

        if (!id) {
            return json({ error: "សូមបញ្ជាក់ transaction id ដើម្បីលុប។" }, 400);
        }

        await deleteDoc(doc(db, "transactions", id));

        return json({ success: true, message: "បានលុប transaction ដោយជោគជ័យ!", id });
    } catch (error) {
        console.error("DELETE transaction failed:", error);
        return json({ error: "មិនអាចលុប transaction ក្នុង Firebase បានទេ។" }, 500);
    }
}

// PUT /api/expandtrack/transactions
export const PUT: APIRoute = async ({ request }) => {
    try {
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== "object") {
            return json({ error: "ទិន្នន័យមិនត្រឹមត្រូវ។" }, 400);
        }

        const id = typeof body.id === "string" ? body.id.trim() : "";
        if (!id) {
            return json({ error: "សូមបញ្ជាក់ transaction id ដើម្បីកែប្រែ។" }, 400);
        }

        const title = typeof body.title === "string" ? body.title.trim() : "";
        const type = typeof body.type === "string" ? body.type.trim() : "EXPENSE";
        const currency = typeof body.currency === "string" ? body.currency.trim() : "៛";
        const amount = getStoredAmount(body.amount, currency);
        const amountInCents = isDollarCurrency(currency);
        const category = typeof body.category === "string" ? body.category.trim() : "";
        const note = typeof body.note === "string" ? body.note.trim() : "";

        if (!title) {
            return json({ error: "សូមបញ្ចូលចំណងជើង (title)។" }, 400);
        }

        const updateData = {
            title,
            type,
            amount,
            amountInCents,
            currency,
            category,
            note,
            updatedAt: serverTimestamp(),
        };

        await updateDoc(doc(db, "transactions", id), updateData);

        return json({
            success: true,
            message: "បានកែប្រែ transaction ដោយជោគជ័យ!",
            transaction: {
                id,
                ...updateData,
                updatedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error("PUT transaction failed:", error);
        return json({ error: "មិនអាចកែប្រែ transaction ក្នុង Firebase បានទេ។" }, 500);
    }
}


