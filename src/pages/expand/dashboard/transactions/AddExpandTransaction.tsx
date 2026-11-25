import { useEffect,useRef,useState } from "react"
import {collection, getDocs } from "firebase/firestore"
import { db } from "../../../../lib/firebase"
import { SelectField } from "./SelectField"

export function AddExpandTransaction (){
    const [rowIds, setRowIds] = useState([1])
    const nexRowId = useRef(2)

    const [category, setCategory] = useState<{ id: string; category: string }[]>()
    // const [isCreateNew, setIsCreateNew] = useState(false)
    const [valueCategories, setValueCategories] = useState<Record<number, string>>({})

    useEffect(()=>{
        const fetchData = async ()=>{
            const snapshot = await getDocs(collection(db,"transactions"));
            const result = snapshot.docs.map(d=>{
                  const data = d.data()
                  return {
                    id: d.id,
                    category: data.category as string
                  }
                })

            setCategory(result)
        }
        fetchData()
    },[])

    const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
    const fieldClass = "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
    return (
        <form className=" space-y-3">
            {rowIds.map((rowId, index)=>(
                <section key={rowId} className=" rounded-xl border border-zinc-200 p-4 space-y-2">
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
                    <div className=" grid grid-cols-5 gap-3">
                        <label className={labelClass}>ចំណងជើង<input type="text" className={fieldClass} placeholder="ឈ្មោះទំនិញ" name="title" maxLength={120} required /></label>
                        <label className={`${labelClass} shrink-0 `}>ប្រភេទ<select className={`${fieldClass} `} name="type" defaultValue="EXPENSE"><option value="EXPENSE">ចំណាយ (EXPENSE)</option><option value="INCOME">ចំណូល (INCOME)</option></select></label>
                        <label className={labelClass}>ចំនួនទឹកប្រាក់<input className={fieldClass} name="amount" type="number" min="0" step="any" placeholder="50000" required /></label>
                        <label className={labelClass}>រូបិយប័ណ្ណ<input  className={fieldClass} name="currency" defaultValue={"៛"} maxLength={8} required /></label>
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
            <button type="button" onClick={ ()=>setRowIds(current=> [...current, nexRowId.current++])}>+ Add Form</button>
        </form>
    )
}
``