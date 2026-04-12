"""
Behavioral metrics — all pure functions.

Each function takes simple Python types (lists, dicts) so they can be
tested independently without loading any ML models.
"""

import itertools
from collections import Counter
from typing import Dict, List

import numpy as np
from scipy.spatial.distance import jensenshannon


# ---------------------------------------------------------------------------
# Distribution-level metrics
# ---------------------------------------------------------------------------

def diversity_score(topic_distribution: Dict[str, float]) -> float:
    """
    Normalized Shannon entropy of a topic distribution.
    0 = all attention on one topic, 1 = perfectly uniform.
    """
    p = np.array(list(topic_distribution.values()), dtype=float)
    p = p / (p.sum() + 1e-9)
    n = len(p)
    h = -np.sum(p * np.log(p + 1e-9))
    return float(h / np.log(n)) if n > 1 else 0.0


def platform_divergence(
    dist1: Dict[str, float], dist2: Dict[str, float]
) -> Dict[str, float]:
    """
    Measure how different two platforms' topic distributions are.
    Returns JSD (0 = identical, 1 = completely different) and cosine similarity.
    """
    keys = sorted(set(dist1) | set(dist2))
    v1 = np.array([dist1.get(k, 0.0) for k in keys], dtype=float)
    v2 = np.array([dist2.get(k, 0.0) for k in keys], dtype=float)
    v1 /= v1.sum() + 1e-9
    v2 /= v2.sum() + 1e-9

    jsd = float(jensenshannon(v1, v2))
    denom = np.linalg.norm(v1) * np.linalg.norm(v2)
    cosine = float(np.dot(v1, v2) / denom) if denom > 0 else 0.0

    return {"jsd": round(jsd, 4), "cosine_similarity": round(cosine, 4)}


# ---------------------------------------------------------------------------
# Sequence-level metrics (require per-item dominant topic)
# ---------------------------------------------------------------------------

def stability_score(topic_sequence: List[str]) -> float:
    """
    Measures sustained attention clusters.
    Built from the topic transition matrix: 1 - normalized weighted transition entropy.
    High (→1) = few topic switches. Low (→0) = rapid switching.
    """
    if len(topic_sequence) < 2:
        return 1.0

    topics = sorted(set(topic_sequence))
    n = len(topics)
    idx = {t: i for i, t in enumerate(topics)}

    counts = np.zeros((n, n))
    for a, b in zip(topic_sequence[:-1], topic_sequence[1:]):
        counts[idx[a]][idx[b]] += 1

    row_sums = counts.sum(axis=1)
    total = row_sums.sum()
    h_total = 0.0
    for i, row_sum in enumerate(row_sums):
        if row_sum > 0:
            row_probs = counts[i] / row_sum
            h_row = -np.sum(row_probs * np.log(row_probs + 1e-9))
            h_total += (row_sum / total) * h_row

    h_max = np.log(n) if n > 1 else 1.0
    return float(round(1.0 - h_total / h_max, 4))


def curiosity_score(topic_sequence: List[str]) -> float:
    """
    Fraction of items that introduced a topic not seen before.
    High = exploratory breadth-seeker. Low = niche specialist.
    """
    if not topic_sequence:
        return 0.0
    seen: set = set()
    new = 0
    for t in topic_sequence:
        if t not in seen:
            new += 1
            seen.add(t)
    return float(round(new / len(topic_sequence), 4))


def rabbit_hole_depth(topic_sequence: List[str]) -> int:
    """
    Longest consecutive run of the same dominant topic.
    High = deep immersion / binge behavior.
    """
    if not topic_sequence:
        return 0
    return max(sum(1 for _ in grp) for _, grp in itertools.groupby(topic_sequence))


def attention_fragmentation(topic_sequence: List[str]) -> float:
    """
    Fraction of consecutive pairs that switch topic.
    0 = fully focused session. 1 = switches every single item.
    """
    if len(topic_sequence) < 2:
        return 0.0
    switches = sum(
        1 for a, b in zip(topic_sequence[:-1], topic_sequence[1:]) if a != b
    )
    return float(round(switches / (len(topic_sequence) - 1), 4))


def algorithmic_drift(topic_sequence: List[str], all_labels: List[str]) -> float:
    """
    Jensen-Shannon divergence between the first and second half of activity.
    High = interests shifted significantly over the recorded period.
    Low = stable long-term interest pattern.
    """
    if len(topic_sequence) < 4:
        return 0.0

    mid = len(topic_sequence) // 2
    early, late = topic_sequence[:mid], topic_sequence[mid:]

    def to_dist(seq: List[str]) -> np.ndarray:
        counts = Counter(seq)
        v = np.array([counts.get(l, 0) for l in all_labels], dtype=float)
        return v / (v.sum() + 1e-9)

    return float(round(jensenshannon(to_dist(early), to_dist(late)), 4))


# ---------------------------------------------------------------------------
# Commercial & profilability
# ---------------------------------------------------------------------------

def commercial_intensity(commercial_scores: List[float]) -> float:
    """Mean commercial intent probability across all items."""
    if not commercial_scores:
        return 0.0
    return float(round(float(np.mean(commercial_scores)), 4))


def profilability_score(
    topic_distribution: Dict[str, float], comm_intensity: float
) -> float:
    """
    Estimate how easily an algorithm could build a behavioral profile.
    Low diversity (concentrated interests) + high commercial signal = more profilable.
    Range: 0 (hard to profile) → 1 (easily profiled).
    """
    div = diversity_score(topic_distribution)
    # Low diversity means predictable interests; weight with commercial signal
    return float(round((1.0 - div) * 0.6 + comm_intensity * 0.4, 4))
