"""
Inference pipeline: text → behavioral report.

Flow:
  raw texts
    → classify each item (topic probs + commercial score)
    → aggregate topic distribution per platform
    → compute behavioral metrics (existing)
    → compute sequence metrics: predictability + turning points  [NEW]
    → assign persona cluster via k-means                         [NEW]
    → return structured report
"""

from typing import Dict, List

from classifier import classify_text, labels
from inference.metrics import (
    algorithmic_drift,
    attention_fragmentation,
    commercial_intensity,
    curiosity_score,
    diversity_score,
    platform_divergence,
    rabbit_hole_depth,
    stability_score,
)
from ml.sequence_model import compute_sequence_metrics
from ml.persona_clusters import assign_cluster


# ---------------------------------------------------------------------------
# Commercial intent — keyword heuristic (replace with trained model in Phase 2)
# ---------------------------------------------------------------------------

_COMMERCIAL_KEYWORDS = {
    "buy", "purchase", "price", "cheap", "sale", "deal", "discount", "coupon",
    "best", "top", "review", "reviews", "vs", "compare", "comparison",
    "recommend", "recommendations", "shop", "store", "brand", "brands",
    "product", "affordable", "budget", "luxury", "worth it", "ranking",
}


def _commercial_score(text: str) -> float:
    words = set(text.lower().split())
    hits = len(words & _COMMERCIAL_KEYWORDS)
    return min(hits / 2.0, 1.0)


# ---------------------------------------------------------------------------
# Per-item classification
# ---------------------------------------------------------------------------

def _classify_item(text: str) -> Dict:
    topic_probs = classify_text(text)
    dominant_topic = max(topic_probs, key=topic_probs.get)
    return {
        "text": text,
        "topic_probs": topic_probs,
        "dominant_topic": dominant_topic,
        "commercial_score": _commercial_score(text),
    }


def _aggregate_distribution(items: List[Dict]) -> Dict[str, float]:
    totals = {label: 0.0 for label in labels}
    for item in items:
        for label, prob in item["topic_probs"].items():
            totals[label] += prob
    n = max(len(items), 1)
    return {label: round(totals[label] / n, 4) for label in labels}


# ---------------------------------------------------------------------------
# Per-platform report
# ---------------------------------------------------------------------------

def _platform_report(items: List[Dict]) -> Dict:
    if not items:
        return {
            "item_count": 0,
            "topic_distribution": {},
            "commercial_intensity": 0.0,
            "diversity_score": 0.0,
            "stability_score": 1.0,
            "curiosity_score": 0.0,
            "rabbit_hole_depth": 0,
            "attention_fragmentation": 0.0,
            "algorithmic_drift": 0.0,
            "top_topics": [],
            "sequence_predictability": 0.5,
            "turning_points": [],
        }

    topic_dist = _aggregate_distribution(items)
    sequence = [item["dominant_topic"] for item in items]
    comm_scores = [item["commercial_score"] for item in items]

    top_topics = sorted(topic_dist.items(), key=lambda x: x[1], reverse=True)[:3]
    seq_metrics = compute_sequence_metrics(sequence, labels)

    return {
        "item_count": len(items),
        "topic_distribution": topic_dist,
        "commercial_intensity": commercial_intensity(comm_scores),
        "diversity_score": diversity_score(topic_dist),
        "stability_score": stability_score(sequence),
        "curiosity_score": curiosity_score(sequence),
        "rabbit_hole_depth": rabbit_hole_depth(sequence),
        "attention_fragmentation": attention_fragmentation(sequence),
        "algorithmic_drift": algorithmic_drift(sequence, labels),
        "top_topics": [{"topic": t, "weight": round(w, 4)} for t, w in top_topics],
        "sequence_predictability": seq_metrics["sequence_predictability"],
        "turning_points": seq_metrics["turning_points"],
    }


# ---------------------------------------------------------------------------
# Full pipeline
# ---------------------------------------------------------------------------

def run_pipeline(google_texts: List[str], tiktok_texts: List[str]) -> Dict:
    google_items = [_classify_item(t) for t in google_texts]
    tiktok_items = [_classify_item(t) for t in tiktok_texts]

    google_report = _platform_report(google_items)
    tiktok_report = _platform_report(tiktok_items)

    cross: Dict = {}
    if google_items and tiktok_items:
        cross = platform_divergence(
            google_report["topic_distribution"],
            tiktok_report["topic_distribution"],
        )

        # Profilability: now the mean of actual sequence prediction accuracy
        cross["profilability_score"] = round(
            (
                google_report["sequence_predictability"]
                + tiktok_report["sequence_predictability"]
            )
            / 2,
            4,
        )

        # K-means persona cluster — average behavioral features across platforms
        avg_rabbit_hole = int(
            round(
                (google_report["rabbit_hole_depth"] + tiktok_report["rabbit_hole_depth"]) / 2
            )
        )
        cross["persona_cluster"] = assign_cluster(
            diversity=(google_report["diversity_score"] + tiktok_report["diversity_score"]) / 2,
            stability=(google_report["stability_score"] + tiktok_report["stability_score"]) / 2,
            curiosity=(google_report["curiosity_score"] + tiktok_report["curiosity_score"]) / 2,
            rabbit_hole_depth=avg_rabbit_hole,
            fragmentation=(
                google_report["attention_fragmentation"]
                + tiktok_report["attention_fragmentation"]
            ) / 2,
            drift=(
                google_report["algorithmic_drift"] + tiktok_report["algorithmic_drift"]
            ) / 2,
            commercial=(
                google_report["commercial_intensity"] + tiktok_report["commercial_intensity"]
            ) / 2,
        )

    return {
        "google": google_report,
        "tiktok": tiktok_report,
        "cross_platform": cross,
    }
