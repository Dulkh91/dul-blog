
interface  BarchartProp{
    date: string;
    income: number;
    expense: number;
}
interface DataProp {
  data: BarchartProp[];
  currency?: string;
}

// BarChart({ data }: { data: { date: string; income: number; expense: number }[] }
export function BarChart({ data, currency = "" }: DataProp) {
  if (!data.length) return <p className="text-center text-xs text-zinc-400 py-8">គ្មានទិន្ន័យ</p>;
  const maxVal = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const W = 60; // bar group width
  const H = 160;
  const PAD = 24;
  const totalW = data.length * W + PAD * 2;

  return (
    <div className="overflow-x-auto">
      <svg width={totalW} height={H + 40} className="min-w-full">
        {/* Y grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = PAD + H - frac * H;
          return (
            <g key={frac}>
              <line x1={PAD} x2={totalW - PAD} y1={y} y2={y} stroke="#e4e4e7" strokeWidth={1} strokeDasharray="3 3" />
              <text x={PAD - 4} y={y + 4} fontSize={8} textAnchor="end" fill="#a1a1aa">
                {Math.round(frac * maxVal).toLocaleString()}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const x = PAD + i * W;
          const incH = (d.income / maxVal) * H;
          const expH = (d.expense / maxVal) * H;
          const bw = 20;
          return (
            <g key={d.date}>
              {/* Income bar */}
              <rect
                x={x + 4}
                y={PAD + H - incH}
                width={bw}
                height={incH}
                fill="#22c55e"
                rx={3}
              >
                <title>ចំណូល: {d.income.toLocaleString()}{currency ? ` ${currency}` : ""}</title>
              </rect>
              {/* Expense bar */}
              <rect
                x={x + bw + 8}
                y={PAD + H - expH}
                width={bw}
                height={expH}
                fill="#f43f5e"
                rx={3}
              >
                <title>ចំណាយ: {d.expense.toLocaleString()}{currency ? ` ${currency}` : ""}</title>
              </rect>
              {/* X label */}
              <text
                x={x + W / 2}
                y={PAD + H + 14}
                fontSize={8}
                textAnchor="middle"
                fill="#71717a"
              >
                {d.date.slice(5)} {/* MM-DD */}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex gap-4 justify-center mt-1">
        <span className="flex items-center gap-1 text-xs text-zinc-500"><span className="w-3 h-3 rounded bg-green-500 inline-block" />ចំណូល</span>
        <span className="flex items-center gap-1 text-xs text-zinc-500"><span className="w-3 h-3 rounded bg-rose-500 inline-block" />ចំណាយ</span>
      </div>
    </div>
  );
}
