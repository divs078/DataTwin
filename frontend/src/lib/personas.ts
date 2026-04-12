import type { AnalysisResult } from "../types";

export interface Persona {
  id: string;
  emoji: string;
  name: string;
  tagline: string;
  description: string;
  gradient: string;
  textColor: string;
  borderColor: string;
  pillColor: string;
}

const PERSONAS: Persona[] = [
  {
    id: "deep_diver",
    emoji: "🤿",
    name: "The Deep Diver",
    tagline: "You go all-in and stay there.",
    description:
      "Once something catches your eye, you don't just skim the surface — you go deep. You'll spend hours on one topic before even thinking about coming up for air.",
    gradient: "from-blue-900 to-cyan-800",
    textColor: "text-cyan-50",
    borderColor: "border-cyan-700",
    pillColor: "bg-cyan-700 text-cyan-100",
  },
  {
    id: "butterfly",
    emoji: "🦋",
    name: "The Butterfly",
    tagline: "Always onto the next thing.",
    description:
      "Your attention hops between topics like it's allergic to staying still. You're endlessly curious — just never for too long.",
    gradient: "from-fuchsia-700 to-rose-600",
    textColor: "text-rose-50",
    borderColor: "border-fuchsia-500",
    pillColor: "bg-fuchsia-700 text-fuchsia-100",
  },
  {
    id: "algorithms_darling",
    emoji: "🎯",
    name: "The Algorithm's Darling",
    tagline: "The feed knows you better than your friends do.",
    description:
      "Your behavior is consistent and highly legible to recommendation engines. Every ad platform's dream — you're easy to profile and probably very well-served content.",
    gradient: "from-violet-800 to-purple-700",
    textColor: "text-violet-50",
    borderColor: "border-violet-500",
    pillColor: "bg-violet-700 text-violet-100",
  },
  {
    id: "ghost",
    emoji: "👻",
    name: "The Ghost",
    tagline: "You're impossible to pin down.",
    description:
      "You're all over the place — in the best way. Your interests defy easy categorization and algorithms struggle to figure you out. That's actually a superpower.",
    gradient: "from-slate-700 to-gray-600",
    textColor: "text-gray-50",
    borderColor: "border-slate-500",
    pillColor: "bg-slate-600 text-slate-100",
  },
  {
    id: "scholar",
    emoji: "📚",
    name: "The Scholar",
    tagline: "Always learning, always growing.",
    description:
      "Your consumption patterns lean toward knowledge-seeking. You gravitate toward new topics, educational content, and self-improvement. Your brain is basically a sponge.",
    gradient: "from-emerald-800 to-teal-700",
    textColor: "text-emerald-50",
    borderColor: "border-emerald-600",
    pillColor: "bg-emerald-700 text-emerald-100",
  },
  {
    id: "trend_chaser",
    emoji: "🌊",
    name: "The Trend Chaser",
    tagline: "Whatever's hot, you're already on it.",
    description:
      "Your interests shift with the cultural tide. You're always riding the next wave — which means you're ahead of the curve, but rarely stay long enough to become an expert.",
    gradient: "from-sky-700 to-indigo-700",
    textColor: "text-sky-50",
    borderColor: "border-sky-500",
    pillColor: "bg-sky-700 text-sky-100",
  },
  {
    id: "loyalist",
    emoji: "🏰",
    name: "The Loyalist",
    tagline: "You know what you like and you stick to it.",
    description:
      "Consistent, focused, unwavering. You've found your lane and you live in it. Your interests don't drift — they deepen over time.",
    gradient: "from-amber-700 to-orange-700",
    textColor: "text-amber-50",
    borderColor: "border-amber-600",
    pillColor: "bg-amber-700 text-amber-100",
  },
  {
    id: "consumer",
    emoji: "🛍️",
    name: "The Consumer",
    tagline: "Your feed is basically a shopping mall.",
    description:
      "Purchase-intent signals are strong with this one. A significant chunk of what you browse has a commercial angle — reviews, products, deals, lifestyle content. Marketers love you.",
    gradient: "from-pink-700 to-red-600",
    textColor: "text-pink-50",
    borderColor: "border-pink-500",
    pillColor: "bg-pink-700 text-pink-100",
  },
  {
    id: "double_life",
    emoji: "🎭",
    name: "The Double Life",
    tagline: "A completely different person on each platform.",
    description:
      "What you search for on Google and what you scroll on TikTok barely overlap. You wear different digital masks — and maybe that's exactly how you like it.",
    gradient: "from-indigo-800 to-fuchsia-800",
    textColor: "text-indigo-50",
    borderColor: "border-indigo-500",
    pillColor: "bg-indigo-700 text-indigo-100",
  },
  {
    id: "echo",
    emoji: "🔄",
    name: "The Echo",
    tagline: "Consistent, coherent, all the way through.",
    description:
      "Your interests are aligned across every platform you use. What you search for and what you watch tell the same story. No contradictions — just a very clear signal.",
    gradient: "from-teal-700 to-cyan-700",
    textColor: "text-teal-50",
    borderColor: "border-teal-500",
    pillColor: "bg-teal-700 text-teal-100",
  },
];

interface ScoredPersona {
  persona: Persona;
  score: number;
  reasons: string[];
}

export interface PersonaResult {
  primary: Persona;
  primaryReasons: string[];
  secondary: Persona | null;
  secondaryReasons: string[];
  /** True when the primary persona came from the k-means backend cluster */
  mlAssigned: boolean;
  /** Cluster confidence from the backend (0–1), or null if rule-based */
  mlConfidence: number | null;
}

function avg(a: number, b: number) {
  return (a + b) / 2;
}

export function classifyPersona(result: AnalysisResult): PersonaResult {
  const g = result.google;
  const t = result.tiktok;
  const c = result.cross_platform;

  // If the backend returned a k-means cluster, use it as the primary persona.
  // The rule-based scoring below still runs for the secondary persona.
  const backendCluster = c?.persona_cluster;
  const backendPersona = backendCluster
    ? PERSONAS.find((p) => p.id === backendCluster.id) ?? null
    : null;

  const avgDiversity = avg(g.diversity_score, t.diversity_score);
  const avgStability = avg(g.stability_score, t.stability_score);
  const avgCuriosity = avg(g.curiosity_score, t.curiosity_score);
  const avgRabbitHole = avg(g.rabbit_hole_depth, t.rabbit_hole_depth);
  const avgFragmentation = avg(g.attention_fragmentation, t.attention_fragmentation);
  const avgDrift = avg(g.algorithmic_drift, t.algorithmic_drift);
  const avgCommercial = avg(g.commercial_intensity, t.commercial_intensity);

  const knowledgeTopics = new Set(["self improvement", "technology"]);
  const hasKnowledgeFocus = [...g.top_topics, ...t.top_topics].some((entry) =>
    knowledgeTopics.has(entry.topic)
  );

  const pct = (v: number) => `${(v * 100).toFixed(0)}%`;

  const scores: ScoredPersona[] = [
    {
      persona: PERSONAS.find((p) => p.id === "deep_diver")!,
      score:
        (avgRabbitHole > 8 ? 2 : avgRabbitHole > 4 ? 1 : 0) +
        (avgDiversity < 0.4 ? 2 : avgDiversity < 0.55 ? 1 : 0),
      reasons: [
        avgRabbitHole > 4
          ? `Rabbit hole depth of ${avgRabbitHole.toFixed(0)} — you binge deep`
          : "",
        avgDiversity < 0.55
          ? `Low diversity score (${pct(avgDiversity)}) — you stay hyper-focused`
          : "",
      ].filter(Boolean),
    },
    {
      persona: PERSONAS.find((p) => p.id === "butterfly")!,
      score:
        (avgFragmentation > 0.65 ? 2 : avgFragmentation > 0.5 ? 1 : 0) +
        (avgDiversity > 0.65 ? 2 : avgDiversity > 0.5 ? 1 : 0),
      reasons: [
        avgFragmentation > 0.5
          ? `High fragmentation (${pct(avgFragmentation)}) — your attention hops constantly`
          : "",
        avgDiversity > 0.5
          ? `High diversity (${pct(avgDiversity)}) — you're all over the place`
          : "",
      ].filter(Boolean),
    },
    {
      persona: PERSONAS.find((p) => p.id === "algorithms_darling")!,
      score:
        (c.profilability_score > 0.65 ? 3 : c.profilability_score > 0.5 ? 1 : 0) +
        (avgStability > 0.6 ? 1 : 0),
      reasons: [
        c.profilability_score > 0.5
          ? `Profilability score of ${pct(c.profilability_score)} — your patterns are very legible`
          : "",
        avgStability > 0.6
          ? `High stability (${pct(avgStability)}) — consistent, predictable behavior`
          : "",
      ].filter(Boolean),
    },
    {
      persona: PERSONAS.find((p) => p.id === "ghost")!,
      score:
        (c.profilability_score < 0.35 ? 3 : c.profilability_score < 0.5 ? 1 : 0) +
        (avgDiversity > 0.6 ? 1 : 0),
      reasons: [
        c.profilability_score < 0.5
          ? `Low profilability (${pct(c.profilability_score)}) — hard to categorize`
          : "",
        avgDiversity > 0.6 ? `High diversity (${pct(avgDiversity)}) — no clear pattern` : "",
      ].filter(Boolean),
    },
    {
      persona: PERSONAS.find((p) => p.id === "scholar")!,
      score:
        (avgCuriosity > 0.6 ? 2 : avgCuriosity > 0.45 ? 1 : 0) + (hasKnowledgeFocus ? 2 : 0),
      reasons: [
        avgCuriosity > 0.45
          ? `Curiosity score of ${pct(avgCuriosity)} — you constantly seek new topics`
          : "",
        hasKnowledgeFocus ? "Self-improvement or technology dominates your top topics" : "",
      ].filter(Boolean),
    },
    {
      persona: PERSONAS.find((p) => p.id === "trend_chaser")!,
      score: avgDrift > 0.6 ? 3 : avgDrift > 0.45 ? 2 : avgDrift > 0.3 ? 1 : 0,
      reasons: [
        avgDrift > 0.3
          ? `High algorithmic drift (${pct(avgDrift)}) — your interests shift frequently`
          : "",
      ].filter(Boolean),
    },
    {
      persona: PERSONAS.find((p) => p.id === "loyalist")!,
      score:
        (avgStability > 0.7 ? 2 : avgStability > 0.55 ? 1 : 0) +
        (avgDrift < 0.3 ? 2 : avgDrift < 0.45 ? 1 : 0),
      reasons: [
        avgStability > 0.55
          ? `High stability (${pct(avgStability)}) — you know exactly what you like`
          : "",
        avgDrift < 0.45
          ? `Low algorithmic drift (${pct(avgDrift)}) — your interests don't wander`
          : "",
      ].filter(Boolean),
    },
    {
      persona: PERSONAS.find((p) => p.id === "consumer")!,
      score: avgCommercial > 0.5 ? 3 : avgCommercial > 0.35 ? 2 : avgCommercial > 0.2 ? 1 : 0,
      reasons: [
        avgCommercial > 0.2
          ? `Commercial intensity of ${pct(avgCommercial)} — lots of purchase-intent content`
          : "",
      ].filter(Boolean),
    },
    {
      persona: PERSONAS.find((p) => p.id === "double_life")!,
      score: c.jsd > 0.6 ? 3 : c.jsd > 0.45 ? 2 : c.jsd > 0.3 ? 1 : 0,
      reasons: [
        c.jsd > 0.3
          ? `Platform divergence of ${pct(c.jsd)} — very different across Google vs. TikTok`
          : "",
      ].filter(Boolean),
    },
    {
      persona: PERSONAS.find((p) => p.id === "echo")!,
      score:
        (c.cosine_similarity > 0.75 ? 2 : c.cosine_similarity > 0.6 ? 1 : 0) +
        (c.jsd < 0.25 ? 2 : c.jsd < 0.4 ? 1 : 0),
      reasons: [
        c.cosine_similarity > 0.6
          ? `Topic overlap of ${pct(c.cosine_similarity)} — same interests everywhere`
          : "",
        c.jsd < 0.4 ? `Low platform divergence (${pct(c.jsd)}) — consistent across platforms` : "",
      ].filter(Boolean),
    },
  ];

  const sorted = scores
    .filter((s) => s.score > 0 && s.reasons.length > 0)
    .sort((a, b) => b.score - a.score);

  const ruleBasedPrimary = sorted[0] ?? {
    persona: PERSONAS.find((p) => p.id === "butterfly")!,
    reasons: ["Your usage patterns are wonderfully unique."],
  };

  // Use backend k-means cluster as primary if available; fall back to rule-based
  const usingML = backendPersona !== null;
  const primaryPersona = backendPersona ?? ruleBasedPrimary.persona;
  const primaryReasons = ruleBasedPrimary.reasons;

  // Secondary: best rule-based result that isn't the primary
  const secondaryCandidate = sorted.find(
    (s) => s.score >= 1 && s.persona.id !== primaryPersona.id
  ) ?? null;

  return {
    primary: primaryPersona,
    primaryReasons,
    secondary: secondaryCandidate?.persona ?? null,
    secondaryReasons: secondaryCandidate?.reasons ?? [],
    mlAssigned: usingML,
    mlConfidence: usingML ? (backendCluster?.confidence ?? null) : null,
  };
}
