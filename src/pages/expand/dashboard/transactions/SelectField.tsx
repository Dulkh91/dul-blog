import React, { useState } from "react";

interface DataProp {
  id: string;
  category: string;
}

interface SelectFieldProp {
  value: string;
  datas: DataProp[];
  onChange: (category: string) => void;
  name?: string;
}

export function SelectField({ datas, value, onChange, name = "category" }: SelectFieldProp) {
  const [isCreateNew, setIsCreateNew] = useState(false);

  const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
  const fieldClass = "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    // ត្រូវប្រើ === មិនមែន = ទេ
    if (e.target.value === "new") {
      setIsCreateNew(true);
      onChange("");
      return;
    }

    setIsCreateNew(false);
    onChange(e.target.value);
  };

  return (
    <label className={`${labelClass} items-center `}>
      Category
       <div className=" flex items-center">
        <select
            className={`${fieldClass} ${isCreateNew? " hidden": "w-full" }`}
            value={isCreateNew ? "new" : value}
            onChange={handleChange}
            name={!isCreateNew ? name : undefined}
        >
            <option value="" disabled>
            ជ្រើសរើស category
            </option>
            {datas?.map((cate) => (
            <option key={cate.id} value={cate.category}>
                {cate.category}
            </option>
            ))}
            <option value="new">+ បញ្ចូលថ្មី</option>
        </select>

        {isCreateNew && (
           <div className={`${fieldClass} flex items-center`}>
                <input
                type="text"
                className=" h-full w-full bg-white px-3 text-sm text-zinc-900 outline-none focus:border-none focus:ring-0  "
                placeholder="វាយបញ្ចូល category ថ្មី..."
                value={value}
                onChange={(event) => onChange(event.target.value)}
                name={name}
                required
                autoFocus
            />

              <button type="button" className=" w-1" onClick={()=>{
                 setIsCreateNew(false)
                    onChange("")
              }}>&times;</button>  
           </div> 
            
            
      )}
      </div> 
    </label>
  );
}
