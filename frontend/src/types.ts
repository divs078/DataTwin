export interface TopicEntry {
  topic: string;
  weight: number;
}

export interface TurningPoint {
  index: number;
  from_topic: string;
  to_topic: string;
  shift_magnitude: number;
}

export interface PlatformReport {
  item_count: number;
  topic_distribution: Record<string, number>;
  commercial_intensity: number;
  diversity_score: number;
  stability_score: number;
  curiosity_score: number;
  rabbit_hole_depth: number;
  attention_fragmentation: number;
  algorithmic_drift: number;
  top_topics: TopicEntry[];
  // Sequence model outputs
  sequence_predictability: number;
  turning_points: TurningPoint[];
}

export interface PersonaCluster {
  id: string;
  name: string;
  description: string;
  confidence: number;
  distances: Record<string, number>;
}

export interface CrossPlatform {
  jsd: number;
  cosine_similarity: number;
  profilability_score: number;
  persona_cluster: PersonaCluster;
}

export interface AnalysisResult {
  google: PlatformReport;
  tiktok: PlatformReport;
  cross_platform: CrossPlatform;
}
