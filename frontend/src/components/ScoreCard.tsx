interface Props {
  label: string;
  value: number | string;
  description: string;
  format?: "percent" | "raw" | "int";
}

export function ScoreCard({ label, value, description, format = "percent" }: Props) {
  const display =
    format === "percent"
      ? `${(Number(value) * 100).toFixed(0)}%`
      : format === "int"
      ? String(value)
      : Number(value).toFixed(3);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-1 shadow-sm">
      <span className="text-2xl font-bold text-indigo-600">{display}</span>
      <span className="text-sm font-semibold text-gray-800">{label}</span>
      <span className="text-xs text-gray-400 leading-snug">{description}</span>
    </div>
  );
}
