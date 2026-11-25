import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { formatDateTimeLocal } from "@components/lib/date";
type Workspace = {
  id: string;
  name: string;
  currency: string;
};

type Props = {
  userId: string;
  workspaces: Workspace[];
  initialWorkspaceId?: string;
};

type Category = {
  id: string;
  name: string;
};



export function AddTransiction({ userId, workspaces, initialWorkspaceId = "" }: Props) {
  const defaultWorkspaceId = workspaces.some((workspace) => workspace.id === initialWorkspaceId)
    ? initialWorkspaceId
    : workspaces[0]?.id ?? "";
  const [workspaceId, setWorkspaceId] = useState(defaultWorkspaceId);
  const [rowIds, setRowIds] = useState([1]);
  const nextRowId = useRef(2);
  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === workspaceId),
    [workspaces, workspaceId],
  );
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ message: string; error: boolean } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState("");

  useEffect(() => {
    if (!workspaceId) {
      setCategories([]);
      setCategoriesLoading(false);
      return;
    }

    let cancelled = false;
    setCategories([]);
    setCategoriesLoading(true);
    setCategoriesError("");

    fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/category`)
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error ?? "មិនអាចទាញយក category បានទេ។");
        if (!cancelled) setCategories(Array.isArray(result.categories) ? result.categories : []);
      })
      .catch((error) => {
        if (!cancelled) {
          setCategoriesError(error instanceof Error ? error.message : "មិនអាចទាញយក category បានទេ។");
        }
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });

    return () => { cancelled = true; };
  }, [workspaceId]);

  
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!workspaceId || !userId) {
      setNotice({ message: "សូមជ្រើសរើស workspace និងចូលគណនីជាមុនសិន។", error: true });
      return;
    }

    const form = event.currentTarget;
    const rowElements = Array.from(form.querySelectorAll<HTMLElement>("[data-transaction-row]"));
    const payloads = rowElements.map((row) => {
      const value = (name: string) => row.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[name="${name}"]`)?.value ?? "";
      const occurredAt = new Date(value("occurredAt"));
      return {
        userId,
        title: value("title").trim(),
        type: value("type"),
        quantity: Number(value("quantity")),
        unit: value("unit").trim(),
        amount: Number(value("amount")),
        currency: value("currency").trim().toUpperCase(),
        categoryId: value("categoryId").trim(),
        note: value("note").trim(),
        occurredAt: Number.isFinite(occurredAt.getTime()) ? occurredAt.toISOString() : "",
      };
    });
    if (payloads.some((payload) => !payload.occurredAt)) {
      setNotice({ message: "សូមជ្រើសរើសថ្ងៃ និងម៉ោងប្រតិបត្តិការគ្រប់ form។", error: true });
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      let saved = 0;
      for (const payload of payloads) {
        const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/transactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(`${result.error || "មិនអាចរក្សាទុក transaction បានទេ។"} (រក្សាទុកបាន ${saved}/${payloads.length})`);
        }
        saved += 1;
      }

      formElement.reset();
      setRowIds([nextRowId.current++]);
      setNotice({ message: `បានរក្សាទុក transaction ${saved} ជួរដោយជោគជ័យ។`, error: false });
    } catch (error) {
      setNotice({
        message: error instanceof Error ? error.message : "មិនអាចទាក់ទងទៅ server បានទេ។",
        error: true,
      });
    } finally {
      setBusy(false);
    }
  }

  const fieldClass = "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
  const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

  if (workspaces.length === 0) {
    return (
      <section className="mx-auto  max-w-3xl rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
        មិនទាន់មាន workspace ទេ។ សូមបង្កើត workspace ជាមុនសិន។
        <a className="ml-2 font-semibold underline" href="/dul/expand-track">ទៅកាន់ Workspaces</a>
      </section>
    );
  }

//   const date = new Intl.DateTimeFormat('km-KH', { dateStyle: 'medium' }).format(new Date(createdAt));
 const date = new Intl.DateTimeFormat('km-KH', { dateStyle: 'medium' })
  return (
    <form onSubmit={handleSubmit} className=" space-y-3">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">បញ្ចូល Transaction</h1>
      </div>

      <label className={labelClass}>
        Workspace
        <select className={fieldClass} value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)} required>
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
          ))}
        </select>
      </label>

      <div className=" space-y-4">
        {rowIds.map((rowId, index) => (
          <section key={rowId} data-transaction-row className=" space-y-4 w-full rounded-xl border border-zinc-200 p-1 md:p-4 dark:border-zinc-700 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Transaction #{index + 1}</p>
              {rowIds.length > 1 && (
                <button
                  type="button"
                  onClick={() => setRowIds((current) => current.filter((id) => id !== rowId))}
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                  aria-label={`លុប Transaction #${index + 1}`}
                >លុប Form</button>
              )}
            </div>

            <div className="  grid grid-cols-2 md:grid-cols-9 w-full space-x-2 ">
              <label className={`${labelClass} md:col-span-2`}>ចំណងជើង<input className={fieldClass} name="title" placeholder="ឧ. ទិញអង្ករ" maxLength={120} required /></label>
              <label className={`${labelClass} shrink-0 `}>ប្រភេទ<select className={`${fieldClass} `} name="type" defaultValue="EXPENSE"><option value="EXPENSE">ចំណាយ (EXPENSE)</option><option value="INCOME">ចំណូល (INCOME)</option></select></label>
              <label className={`${labelClass} `}>បរិមាណ<input className={fieldClass} name="quantity" type="number" min="0" step="any" defaultValue="1" required /></label>
              <label className={labelClass}>ឯកតា<input className={fieldClass} name="unit" placeholder="ឧ. kg, ដុំ" maxLength={30} required /></label>
              <label className={labelClass}>ចំនួនទឹកប្រាក់<input className={fieldClass} name="amount" type="number" min="0" step="any" placeholder="50000" required /></label>
              <label className={labelClass}>រូបិយប័ណ្ណ<input key={`${workspaceId}-${rowId}`} className={fieldClass} name="currency" defaultValue={selectedWorkspace?.currency || "KHR"} maxLength={8} required /></label>
              <label className={labelClass}>
                Category
                <select className={fieldClass} name="categoryId" defaultValue="" required disabled={categoriesLoading || categories.length === 0}>
                  <option value="" disabled>
                    {categoriesLoading ? "កំពុងទាញយក category…" : "ជ្រើសរើស category"}
                  </option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label className={`${labelClass} shrink-0 `}>ថ្ងៃ និងម៉ោង<input className={fieldClass} name="occurredAt" type="datetime-local" defaultValue={ formatDateTimeLocal(new Date()) } required /></label>
            </div>
                {/* new Date().toISOString().slice(0, 16) */}

            <label className={labelClass}>កំណត់ចំណាំ<textarea className={fieldClass} name="note" rows={1} placeholder="បន្ថែមព័ត៌មានលម្អិត (មិនចាំបាច់)" maxLength={1000} /></label>
          </section>
        ))}
      </div>

      {categoriesError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">{categoriesError}</p>
      ) : !categoriesLoading && categories.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          មិនទាន់មាន category ទេ។{" "}
          <a
            className="font-semibold text-blue-700 underline dark:text-blue-300"
            href={`/dul/expandtrack-dashboard/category-expand?workspaceId=${encodeURIComponent(workspaceId)}`}
          >
            បន្ថែម category
          </a>
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setRowIds((current) => [...current, nextRowId.current++])}
        disabled={busy}
        className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50 dark:text-blue-300 dark:hover:bg-blue-950/30"
      >+ Add Form</button>

      {notice && (
        <p role="status" className={`rounded-lg px-3 py-2 text-sm ${notice.error ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" : "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"}`}>
          {notice.message}
        </p>
      )}

      <div className="flex justify-end">
        <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={busy || !workspaceId || categoriesLoading || categories.length === 0 || Boolean(categoriesError)}>
          {busy ? "កំពុងរក្សាទុក…" : "រក្សាទុក Transaction"}
        </button>
      </div>
    </form>
  );
}
