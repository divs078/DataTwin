import type { PlatformReport, TurningPoint } from "../types";
import { TopicChart } from "./TopicChart";
import { ScoreCard } from "./ScoreCard";

interface Props {
  name: string;
  report: PlatformReport;
  color: string;
}

const TOPIC_COLORS: Record<string, string> = {
  technology: "bg-blue-400",
  fashion: "bg-pink-400",
  politics: "bg-red-400",
  finance: "bg-green-400",
  "self improvement": "bg-violet-400",
  entertainment: "bg-orange-400",
  health: "bg-teal-400",
  travel: "bg-sky-400",
};

function TurningPointTimeline({
  points,
  itemCount,
}: {
  points: TurningPoint[];
  itemCount: number;
}) {
  if (points.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Interest shifts
      </p>
      {/* Track */}
      <div className="relative h-6 flex items-center">
        <div className="absolute inset-x-0 h-1 bg-gray-100 rounded-full" />
        {points.map((pt, i) => {
          const pct = itemCount > 1 ? (pt.index / (itemCount - 1)) * 100 : 50;
          return (
            <div
              key={i}
              className="absolute -translate-x-1/2 group"
              style={{ left: `${pct}%` }}
            >
              {/* Dot */}
              <div
                className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm cursor-default"
                style={{
                  backgroundColor: `hsl(${Math.round(pt.shift_magnitude * 120)}, 65%, 55%)`,
                }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                <div className="bg-gray-900 text-white text-[10px] rounded-md px-2 py-1.5 whitespace-nowrap shadow-lg">
                  <span className="font-semibold">{pt.from_topic}</span>
                  <span className="opacity-60"> → </span>
                  <span className="font-semibold">{pt.to_topic}</span>
                  <br />
                  <span className="opacity-50">shift {Math.round(pt.shift_magnitude * 100)}%</span>
                </div>
                <div className="w-1.5 h-1.5 bg-gray-900 rotate-45 -mt-0.5" />
              </div>
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-1">
        {points.map((pt, i) => (
          <span key={i} className="flex items-center gap-1 text-[11px] text-gray-500">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{
                backgroundColor: `hsl(${Math.round(pt.shift_magnitude * 120)}, 65%, 55%)`,
              }}
            />
            {pt.from_topic} → {pt.to_topic}
          </span>
        ))}
      </div>
    </div>
  );
}

export function PlatformPanel({ name, report, color }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <h2 className="text-lg font-bold text-gray-800">{name}</h2>
        <span className="text-sm text-gray-400">{report.item_count} items analyzed</span>
      </div>

      <TopicChart distribution={report.topic_distribution} label="Topic distribution" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <ScoreCard label="Diversity" value={report.diversity_score} description="How evenly spread your attention is across topics" />
        <ScoreCard label="Stability" value={report.stability_score} description="How consistently you stay on one topic" />
        <ScoreCard label="Curiosity" value={report.curiosity_score} description="Share of items that introduced a new topic" />
        <ScoreCard label="Rabbit Hole" value={report.rabbit_hole_depth} format="int" description="Longest consecutive run on the same topic" />
        <ScoreCard label="Fragmentation" value={report.attention_fragmentation} description="How often your topic switches each item" />
        <ScoreCard label="Algo Drift" value={report.algorithmic_drift} description="How much your interests shifted over time" />
        <ScoreCard label="Commercial" value={report.commercial_intensity} description="Share of content with purchase-intent signals" />
        <ScoreCard
          label="Predictability"
          value={report.sequence_predictability}
          description="How well a Markov model trained on your past can predict your next topic — higher = more profilable"
        />
      </div>

      {report.turning_points && report.turning_points.length > 0 && (
        <TurningPointTimeline
          points={report.turning_points}
          itemCount={report.item_count}
        />
      )}
    </div>
  );
}
