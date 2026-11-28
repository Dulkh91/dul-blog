// ─── Mini Horizontal Bar (Category) ──────────────────────────────────────────
export function CategoryBar({
  data,
  currency = "",
}: {
  data: { label: string; value: number }[];
  currency?: string;
}) {
  if (!data.length) return <p className="text-center text-xs text-zinc-400 py-8">គ្មានទិន្ន័យ</p>;
  const max = Math.max(...data.map((d) => d.value), 1);
  const COLORS = ["#6366f1", "#f59e0b", "#06b6d4", "#84cc16", "#ec4899", "#14b8a6", "#f97316", "#8b5cf6"];
  return (
    <div className="space-y-2">
      {data.map(({ label, value }, i) => (
        <div key={label} className="flex items-center gap-2">
          <span className="text-xs text-zinc-600 w-28 truncate shrink-0">{label}</span>
          <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-4 overflow-hidden">
            <div
              style={{
                width: `${(value / max) * 100}%`,
                background: COLORS[i % COLORS.length],
              }}
              className="h-full rounded-full transition-all duration-500"
            />
          </div>
          <span className="text-xs text-zinc-500 w-24 text-right shrink-0 tabular-nums">
            {value.toLocaleString()}{currency ? ` ${currency}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}