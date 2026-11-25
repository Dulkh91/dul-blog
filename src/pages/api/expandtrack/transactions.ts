import type { APIRoute } from "astro";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase";
export const prerender = false

const json = (data: unknown, status = 200): Response => {
    return new Response(JSON.stringify(data),{
        status,
        headers: {"Content-Type": "application/json; charset=utf-8"}
    })};

export const POST: APIRoute = async ({request})=>{

    try {
        const body = await request.json().catch(()=> null)
        if(!body || typeof body !== "object"){
            return json({error: "ទិន្នន័យមិនត្រឹមត្រូវ។"}, 400)
        }

        const title = typeof body.title === "string"? body.title.trim() : "";
        const type = typeof body.type === "string"? body.type.trim(): "EXPENSE";
        const amount = typeof body.amount === "number"? body.amount : (Number(body.amount) || 0);
        const currency = typeof body.currency === "string"? body.currency.trim(): ""
        const category = typeof body.category === "string"? body.category.trim(): "";
        const note = typeof body.note === "string"? body.note.trim(): "";

        const transaction = {
            title,
            type,
            amount,
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


