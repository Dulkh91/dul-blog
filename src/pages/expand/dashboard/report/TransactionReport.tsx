import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { BarChart } from "./BarChart";
import { formatDateTime } from "@components/lib/date";
import { StatCard, type StatEntry } from "./StatCard";
import {CategoryBar} from './CategoryBar'
import type{ Transaction, FilterType } from "@components/types/Transaction";


// ─── Helpers ─────────────────────────────────────────────────────────────────
function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  const d = new Date(val as string);

  return isNaN(d.getTime()) ? null : d;
}

function getAmount(t: Transaction) {
  return t.amountInCents ? t.amount / 100 : t.amount;
}

function groupByCurrency(txs: Transaction[]): StatEntry[] {
  const map: Record<string, number> = {};
  txs.forEach((t) => {
    const cur = t.currency || "៛";
    map[cur] = (map[cur] ?? 0) + getAmount(t);
  });
  return Object.entries(map).map(([currency, value]) => ({ currency, value }));
}

function startOf(unit: "day" | "week" | "month", ref = new Date()) {
  const d = new Date(ref);
  if (unit === "day") { d.setHours(0, 0, 0, 0); return d; }
  if (unit === "week") {
    const day = d.getDay(); // 0 = Sun
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  d.setDate(1); d.setHours(0, 0, 0, 0); return d;
}

function endOf(unit: "day" | "week" | "month", ref = new Date()) {
  const d = new Date(ref);
  if (unit === "day") { d.setHours(23, 59, 59, 999); return d; }
  if (unit === "week") {
    const day = d.getDay();
    d.setDate(d.getDate() + (6 - day));
    d.setHours(23, 59, 59, 999);
    return d;
  }
  d.setMonth(d.getMonth() + 1, 0); d.setHours(23, 59, 59, 999); return d;
}

// group by YYYY-MM-DD label
function groupByDay(txs: Transaction[]) {
  const map: Record<string, { income: number; expense: number }> = {};
  txs.forEach((t) => {
    if (!t.createdAt) return;
    const key = t.createdAt.toLocaleDateString("en-CA"); // YYYY-MM-DD
    if (!map[key]) map[key] = { income: 0, expense: 0 };
    if (t.type === "INCOME") map[key].income += getAmount(t);
    else map[key].expense += getAmount(t);
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));
}

// group by category
function groupByCategory(txs: Transaction[]) {
  const map: Record<string, number> = {};
  txs.forEach((t) => {
    const key = t.category || "គ្មានប្រភេទ";
    map[key] = (map[key] ?? 0) + getAmount(t);
  });
  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .map(([label, value]) => ({ label, value }));
}



export function TransactionReport() {
  const [all, setAll] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState<FilterType>("monthly");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [currency, setCurrency] = useState("all");

  // fetch once
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "transactions"));
        const data: Transaction[] = snap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            title: d.title ?? "",
            type: d.type ?? "EXPENSE",
            amount: Number(d.amount) || 0,
            amountInCents: d.amountInCents === true,
            currency: d.currency ?? "៛",
            category: d.category ?? "",
            note: d.note ?? "",
            createdAt: toDate(d.createdAt),
          };
        });
        setAll(data);
      } catch {
        setError("មិនអាចទាញទិន្ន័យពី Firebase បានទេ។");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // unique currencies for filter
  const currencies = useMemo(() => {
    const s = new Set<string>();
    all.forEach((t) => s.add(t.currency));
    return Array.from(s);
  }, [all]);

  // date range based on filter
  const [from, to] = useMemo<[Date, Date]>(() => {
    const now = new Date();
    if (filter === "today") return [startOf("day", now), endOf("day", now)];
    if (filter === "weekly") return [startOf("week", now), endOf("week", now)];
    if (filter === "monthly") return [startOf("month", now), endOf("month", now)];
    // custom
    const f = customFrom ? new Date(customFrom + "T00:00:00") : new Date(0);
    const t2 = customTo ? new Date(customTo + "T23:59:59") : new Date();
    return [f, t2];
  }, [filter, customFrom, customTo]);

  // filtered transactions
  const filtered = useMemo(() => {
    return all.filter((t) => {
      if (!t.createdAt) return false;
      if (t.createdAt < from || t.createdAt > to) return false;
      if (currency !== "all" && t.currency !== currency) return false;
      return true;
    });
  }, [all, from, to, currency]);

  // stats per currency
  const incomeEntries = useMemo(
    () => groupByCurrency(filtered.filter((t) => t.type === "INCOME")),
    [filtered]
  );
  const expenseEntries = useMemo(
    () => groupByCurrency(filtered.filter((t) => t.type === "EXPENSE")),
    [filtered]
  );
  const balanceEntries = useMemo<StatEntry[]>(() => {
    const map: Record<string, number> = {};
    filtered.forEach((t) => {
      const cur = t.currency || "៛";
      const amt = getAmount(t);
      map[cur] = (map[cur] ?? 0) + (t.type === "INCOME" ? amt : -amt);
    });
    return Object.entries(map).map(([currency, value]) => ({ currency, value }));
  }, [filtered]);
  const hasNegativeBalance = balanceEntries.some((e) => e.value < 0);

  const groupedByCurrency = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    filtered.forEach((t) => {
      const cur = t.currency || "៛";
      if (!map[cur]) map[cur] = [];
      map[cur].push(t);
    });
    return Object.entries(map).map(([cur, items]) => ({
      currency: cur,
      byDay: groupByDay(items),
      expenseByCategory: groupByCategory(items.filter((t) => t.type === "EXPENSE")),
      incomeByCategory: groupByCategory(items.filter((t) => t.type === "INCOME")),
    }));
  }, [filtered]);

  const expenseGroups = useMemo(
    () => groupedByCurrency.filter((g) => g.expenseByCategory.length > 0),
    [groupedByCurrency]
  );
  const incomeGroups = useMemo(
    () => groupedByCurrency.filter((g) => g.incomeByCategory.length > 0),
    [groupedByCurrency]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-400">
        <svg className="animate-spin h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        កំពុងទាញទិន្ន័យ…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        ⚠️ {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Filter Bar ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {(["today", "weekly", "monthly", "custom"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              filter === f
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {{ today: "ថ្ងៃនេះ", weekly: "សប្តាហ៍", monthly: "ខែ", custom: "កំណត់ custom" }[f]}
          </button>
        ))}

        {/* Currency filter */}
        {currencies.length > 1 && (
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white dark:bg-zinc-900 dark:border-zinc-700 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
          >
            <option value="all">រូបិយប័ណ្ណ: ទាំងអស់</option>
            {currencies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        {/* Custom date range */}
        {filter === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white dark:bg-zinc-900 dark:border-zinc-700 px-2 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <span className="text-xs text-zinc-400">→</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white dark:bg-zinc-900 dark:border-zinc-700 px-2 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        )}

        <span className="ml-auto text-xs text-zinc-400">
          {filtered.length} transactions
        </span>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label="ចំណូលសរុប"
          entries={incomeEntries}
          color="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
          icon="📈"
        />
        <StatCard
          label="ចំណាយសរុប"
          entries={expenseEntries}
          color="border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30"
          icon="📉"
        />
        <StatCard
          label="សមតុល្យ (Balance)"
          entries={balanceEntries}
          color={
            !hasNegativeBalance
              ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30"
              : "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30"
          }
          icon={!hasNegativeBalance ? "✅" : "⚠️"}
        />
      </div>

      {/* ── Bar Chart: Income vs Expense by Day ─────────────── */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
          📊 ចំណូល vs ចំណាយ តាមថ្ងៃ
        </h2>
        {groupedByCurrency.length === 0 ? (
          <BarChart data={[]} />
        ) : (
          <div className="space-y-6">
            {groupedByCurrency.map(({ currency: cur, byDay }) => (
              <div key={cur} className="space-y-2">
                {groupedByCurrency.length > 1 && (
                  <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {cur}
                  </span>
                )}
                <BarChart data={byDay} currency={cur} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Category Breakdown ──────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
            🔴 ចំណាយតាម Category
          </h2>
          {expenseGroups.length === 0 ? (
            <CategoryBar data={[]} />
          ) : (
            <div className="space-y-5">
              {expenseGroups.map(({ currency: cur, expenseByCategory }) => (
                <div key={cur} className="space-y-2">
                  {expenseGroups.length > 1 && (
                    <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {cur}
                    </span>
                  )}
                  <CategoryBar data={expenseByCategory} currency={cur} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
            🟢 ចំណូលតាម Category
          </h2>
          {incomeGroups.length === 0 ? (
            <CategoryBar data={[]} />
          ) : (
            <div className="space-y-5">
              {incomeGroups.map(({ currency: cur, incomeByCategory }) => (
                <div key={cur} className="space-y-2">
                  {incomeGroups.length > 1 && (
                    <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {cur}
                    </span>
                  )}
                  <CategoryBar data={incomeByCategory} currency={cur} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Transactions Table ───────────────────────── */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            🗒️ បញ្ជី Transaction ({filtered.length})
          </h2>
        </div>
        {filtered.length === 0 ? (
          <p className="text-center py-10 text-sm text-zinc-400">គ្មានទិន្ន័យក្នុងช่วงពេលនេះ</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
              <thead className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-2.5">ចំណងជើង</th>
                  <th className="px-4 py-2.5">ប្រភេទ</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5 text-right">ចំនួន</th>
                  <th className="px-4 py-2.5"> កាលបរិច្ឆេទ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filtered
                  .slice()
                  .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
                  .map((t) => (
                    <tr key={t.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-2 font-medium text-zinc-800 dark:text-zinc-100 max-w-[180px] truncate">
                        {t.title}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${
                            t.type === "INCOME"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                          }`}
                        >
                          {t.type === "INCOME" ? "ចំណូល" : "ចំណាយ"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-zinc-500 dark:text-zinc-400">
                        {t.category || "—"}
                      </td>
                      <td className={`px-4 py-2 text-right font-medium tabular-nums ${
                        t.type === "INCOME" ? "text-green-600 dark:text-green-400" : "text-rose-600 dark:text-rose-400"
                      }`}>
                        {t.type === "INCOME" ? "+" : "−"}{getAmount(t).toLocaleString()} {t.currency}
                      </td>
                      <td className="px-4 py-2 text-zinc-400 text-xs whitespace-nowrap">
                        {t.createdAt
                          ? formatDateTime(t.createdAt)
                          : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}



{/* <td className="px-4 py-2 text-zinc-400 text-xs whitespace-nowrap">
                        {t.createdAt
                          ? t.createdAt.toLocaleString("km-KH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td> */}