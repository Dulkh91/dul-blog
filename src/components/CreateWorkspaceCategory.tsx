import { useState, type FormEvent } from "react";

type Props = {
  workspaceId: string;
};

export default function CreateWorkspaceCategory({ workspaceId }: Props) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const returnUrl = workspaceId
    ? `/dul/expandtrack-dashboard/transactions-expand?workspaceId=${encodeURIComponent(workspaceId)}`
    : "/dul/expandtrack-dashboard/transactions-expand";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspaceId) {
      setError("សូមជ្រើសរើស workspace ពីទំព័រ transaction ជាមុនសិន។");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/category`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? "មិនអាចបង្កើត category បានទេ។");
      window.location.assign(returnUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "មិនអាចបង្កើត category បានទេ។");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl space-y-5 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">បង្កើត Category</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Category នឹងត្រូវរក្សាទុកក្នុង workspace ដែលបានជ្រើសរើស។</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          ឈ្មោះ Category
          <input
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="ឧ. អាហារ"
            maxLength={80}
            required
          />
        </label>

        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={busy || !workspaceId}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "កំពុងរក្សាទុក…" : "បង្កើត Category"}
          </button>
          <a href={returnUrl} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
            ត្រឡប់ទៅ Transaction
          </a>
        </div>
      </form>
    </section>
  );
}
