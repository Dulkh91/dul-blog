import React, { useEffect, useRef, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../../../../lib/firebase"
import { SelectField } from "./SelectField"
import { AmountInput } from "./AmountInput"


export function AddExpandTransaction (){
    const [rowIds, setRowIds] = useState([1])
    const nexRowId = useRef(2)

    const [category, setCategory] = useState<{ id: string; category: string }[]>()
    const [valueCategories, setValueCategories] = useState<Record<number, string>>({})

    const [busy, setBusy] = useState(false)
    const [noteMessage, setNoteMessage] = useState<{message: string; error: boolean}| null>(null)
   

    useEffect(()=>{
        const fetchData = async ()=>{
            const snapshot = await getDocs(collection(db,"transactions"));
                        const categories = new Set<string>()
                        snapshot.docs.forEach((doc)=>{
                                const value = doc.data().category
                                if (typeof value === "string" && value.trim()) {
                                        categories.add(value.trim())
                                }
                        })
                        
                        setCategory(Array.from(categories, (value)=>({ id: value, category: value })))
                        // setCategory(Array.from(categories).map(value=>({
                        //     id: value,
                        //     category: value
                        // })))
                        
        }
        fetchData()
    },[])
    

    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>)=>{
        event.preventDefault()

        const formElement = event.currentTarget

        const form = event.currentTarget
        const rowElements = Array.from(form.querySelectorAll<HTMLElement>("[data-transaction-row]"));
        const payloads = rowElements.map((row)=>{
            const value = (name: string)=> row.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> (`[name="${name}"]`)?.value ?? "";
            return {
                title: value("title").trim(),
                type: value("type"),
                amount: Number(value("amount").replace(/,/g, "")) || 0,
                currency: value("currency").trim().toUpperCase(),
                category: value("category").trim(),
                note: value("note").trim()
            }
        });

        if(payloads.some((payload)=> !payload.title)){
            setNoteMessage({message: "សូមបញ្ចូលមុខទំនិញនៅក្នុង form",error: true})
            return;
        };

        setBusy(true)
        setNoteMessage(null)

        try {
            let saved = 1
            for(const payload of payloads){
                const response = await fetch("/api/expandtrack/transactions",{
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload)
             })
             const result = await response.json().catch(()=>({}))
             if(!response.ok){
                throw new Error(`${result.error || "មិនអាចរក្សាទុក transaction បានទេ។"} (រក្សាទុកបាន ${saved}/${payloads.length})`)
             }
             saved += 1;
            }

            formElement.reset()
            setRowIds([nexRowId.current++])
            setNoteMessage({ message: `បានរក្សាទុក transaction ${saved} បានជោគជ័យ។`, error: false })
            
        } catch (error) {
            setNoteMessage({
                    message: error instanceof Error ? error.message : "មិនអាចទាក់ទងទៅ server បានទេ។",
                    error: true,
                })
        }finally{
            setBusy(false)
        }

    }


    const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
    const fieldClass = "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
    return (
        <form className=" space-y-3" onSubmit={handleSubmit}>
            {rowIds.map((rowId, index)=>(
                <section key={rowId} data-transaction-row className=" rounded-xl border border-zinc-200 p-4 space-y-2">
                    <div className=" flex items-center">
                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Transaction #{index+1}</p>
                        {rowIds.length > 1 &&(
                            <button
                                type="button"
                                onClick={()=>setRowIds((current=> current.filter((id)=> id !== rowId)))}
                                className="text-sm font-medium text-red-600 hover:text-red-700 ml-auto"
                            >
                                លុប Form
                            </button>
                        )}
                    </div>
                    <div className=" grid grid-cols-4 gap-3 align-middle">
                        <label className={labelClass}>ចំណងជើង<input type="text" className={fieldClass} placeholder="ឈ្មោះទំនិញ" name="title" maxLength={120} required /></label>
                        <label className={`${labelClass} shrink-0 `}>ប្រភេទ<select className={`${fieldClass} `} name="type" defaultValue="EXPENSE"><option value="EXPENSE">ចំណាយ (EXPENSE)</option><option value="INCOME">ចំណូល (INCOME)</option></select></label>
                        <label className={labelClass}>ចំនួនទឹកប្រាក់<AmountInput  name="amount" placeholder="50,000" required /></label>
                        {/* <label className={labelClass}>រូបិយប័ណ្ណ<input  className={fieldClass} name="currency" defaultValue={"៛"} maxLength={8} required /></label> */}
                        {/* Create category by retrieve db */}
                            {category &&
                                <SelectField
                                    datas={category}
                                    value={valueCategories[rowId] ?? ""}
                                    onChange={(value) => setValueCategories((current) => ({
                                        ...current,
                                        [rowId]: value,
                                    }))}
                                />
                            }
                    </div>
                <label className={labelClass}>កំណត់ចំណាំ<textarea className={fieldClass} name="note" rows={1} placeholder="បន្ថែមព័ត៌មានលម្អិត (មិនចាំបាច់)" maxLength={1000} /></label>
            </section>
            ))}
            <button type="button" 
                className="px-4 py-2 text-xs font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                onClick={ ()=>setRowIds(current=> [...current, nexRowId.current++])}>+ Add Form</button>
            {noteMessage && (
                <p role="status" className={`rounded-lg px-3 py-2 text-sm ${noteMessage.error ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" : "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"}`}>
                    {noteMessage.message}
                </p>
            )}
            <div className=" w-full flex justify-end">
                <button type="submit" disabled={busy || category?.length === 0} className=" ml-auto px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 ">
                    {busy? "កំពុងរក្សាទុក…" : "រក្សាទុក Transaction"}
                </button>
            </div>
        </form>
    )
}