import type { CrossPlatform } from "../types";
import { ScoreCard } from "./ScoreCard";

interface Props {
  cross: CrossPlatform;
}

export function CrossPlatformPanel({ cross }: Props) {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
      <h2 className="text-lg font-bold text-gray-800 mb-1">Cross-Platform Comparison</h2>
      <p className="text-sm text-gray-500 mb-5">
        How different is what you search on Google vs. what you consume on TikTok?
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ScoreCard
          label="Platform Divergence"
          value={cross.jsd}
          format="raw"
          description="Jensen-Shannon divergence — 0 means identical interests, 1 means completely different"
        />
        <ScoreCard
          label="Topic Overlap"
          value={cross.cosine_similarity}
          description="Cosine similarity between topic distributions — higher means more aligned"
        />
        <ScoreCard
          label="Profilability"
          value={cross.profilability_score}
          description="How easily an algorithm could build a behavioral profile of you — lower is better"
        />
      </div>
    </div>
  );
}
