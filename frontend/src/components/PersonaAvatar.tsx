const AVATAR_EMOJI: Record<string, string> = {
  deep_diver:         "🤿",
  butterfly:          "🦋",
  algorithms_darling: "🎯",
  ghost:              "👻",
  scholar:            "📚",
  trend_chaser:       "📈",
  loyalist:           "🛡️",
  consumer:           "🛍️",
  double_life:        "🎭",
  echo:               "🔁",
};

export function PersonaAvatar({ id, className }: { id: string; className?: string }) {
  const emoji = AVATAR_EMOJI[id];
  if (!emoji) return null;
  return (
    <span className={`flex items-center justify-center text-5xl leading-none select-none ${className ?? ""}`}>
      {emoji}
    </span>
  );
}
