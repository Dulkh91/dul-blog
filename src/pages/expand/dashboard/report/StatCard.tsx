// ─── Stat Card ────────────────────────────────────────────────────────────────
// entries = breakdown per currency, e.g. [{ currency: "៛", value: 50000 }, { currency: "$", value: 12 }]

export interface StatEntry {
  currency: string;
  value: number;
}

export function StatCard({
  label,
  entries,
  color,
  icon,
}: {
  label: string;
  entries: StatEntry[];
  color: string;
  icon: string;
}) {
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-2 w-full min-w-0 ${color}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-xl leading-none">{icon}</span>
        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{label}</p>
      </div>

      {/* Per-currency rows */}
      {entries.length === 0 ? (
        <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500">0</p>
      ) : (
        <ul className="space-y-0.5">
          {entries.map(({ currency, value }) => (
            <li
              key={currency}
              className="flex items-baseline justify-between gap-2"
            >
              <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">
                {currency}
              </span>
              <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 tabular-nums text-right truncate">
                {value.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
