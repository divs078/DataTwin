import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = [
  "#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd",
  "#818cf8", "#60a5fa", "#34d399", "#fbbf24",
];

interface Props {
  distribution: Record<string, number>;
  label: string;
}

export function TopicChart({ distribution, label }: Props) {
  const data = Object.entries(distribution)
    .map(([topic, weight]) => ({ topic, weight }))
    .sort((a, b) => b.weight - a.weight);

  return (
    <div>
      <p className="text-sm font-medium text-gray-500 mb-2">{label}</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="topic" width={110} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(v: number | undefined) => v != null ? `${(v * 100).toFixed(1)}%` : ""}
            labelStyle={{ fontWeight: 600 }}
          />
          <Bar dataKey="weight" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
