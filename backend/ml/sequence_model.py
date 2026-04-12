"""
Sequence model: Markov-chain-based behavioral predictability.

Replaces the heuristic profilability score with an operationally defined one:
  profilability = how accurately a model trained on your past can predict your future.

Also detects "turning points" — moments where your interest shifted significantly.
"""

from collections import Counter, defaultdict
from typing import Dict, List

import numpy as np
from scipy.spatial.distance import jensenshannon


# ---------------------------------------------------------------------------
# Markov chain
# ---------------------------------------------------------------------------

def _build_markov(sequence: List[str]) -> Dict[str, Dict[str, float]]:
    """First-order Markov transition probabilities from a topic sequence."""
    counts: Dict[str, Counter] = defaultdict(Counter)
    for a, b in zip(sequence[:-1], sequence[1:]):
        counts[a][b] += 1
    return {
        state: {nxt: c / sum(ctr.values()) for nxt, c in ctr.items()}
        for state, ctr in counts.items()
    }


def _predict(markov: Dict[str, Dict[str, float]], current: str) -> str | None:
    if current not in markov:
        return None
    return max(markov[current], key=markov[current].get)


# ---------------------------------------------------------------------------
# Profilability as sequence predictability
# ---------------------------------------------------------------------------

def sequence_predictability(sequence: List[str]) -> float:
    """
    Train a Markov chain on the first 80% of the topic sequence.
    Evaluate next-topic prediction accuracy on the remaining 20%.

    Returns a score in [0, 1]:
      - High → behavior is highly predictable (algorithm can model you easily)
      - Low  → behavior is erratic / unpredictable (harder to profile)

    Falls back to 0.5 if the sequence is too short to split meaningfully.
    """
    if len(sequence) < 6:
        return 0.5

    split = max(int(len(sequence) * 0.8), 4)
    train, test = sequence[:split], sequence[split:]

    if len(test) < 2:
        return 0.5

    markov = _build_markov(train)

    correct = sum(
        1
        for i in range(len(test) - 1)
        if _predict(markov, test[i]) == test[i + 1]
    )
    return round(correct / (len(test) - 1), 4)


# ---------------------------------------------------------------------------
# Turning point detection
# ---------------------------------------------------------------------------

def find_turning_points(
    sequence: List[str],
    all_labels: List[str],
    window: int = 5,
    jsd_threshold: float = 0.55,
) -> List[Dict]:
    """
    Detect indices where the user's interest distribution shifted significantly.

    Uses a sliding window: compare the topic distribution immediately before
    and after each position. A high Jensen-Shannon divergence between the two
    windows signals a turning point.

    Returns a deduplicated list of turning points, each with:
      - index: position in the sequence
      - from_topic: dominant topic before the shift
      - to_topic: dominant topic after the shift
      - shift_magnitude: JSD between the two windows (0–1)
    """
    n = len(sequence)
    if n < window * 2 + 1:
        return []

    def _dist(subseq: List[str]) -> np.ndarray:
        counts = Counter(subseq)
        v = np.array([counts.get(label, 0) for label in all_labels], dtype=float)
        total = v.sum()
        return v / total if total > 0 else v

    candidates: List[Dict] = []
    for i in range(window, n - window):
        before = sequence[i - window : i]
        after = sequence[i : i + window]
        jsd = float(jensenshannon(_dist(before), _dist(after)))
        if jsd >= jsd_threshold:
            from_topic = Counter(before).most_common(1)[0][0]
            to_topic = Counter(after).most_common(1)[0][0]
            if from_topic != to_topic:
                candidates.append(
                    {
                        "index": i,
                        "from_topic": from_topic,
                        "to_topic": to_topic,
                        "shift_magnitude": round(jsd, 3),
                    }
                )

    if not candidates:
        return []

    # Deduplicate: within any window-sized span, keep the highest-magnitude point
    deduped = [candidates[0]]
    for tp in candidates[1:]:
        if tp["index"] - deduped[-1]["index"] >= window:
            deduped.append(tp)
        elif tp["shift_magnitude"] > deduped[-1]["shift_magnitude"]:
            deduped[-1] = tp

    return deduped


# ---------------------------------------------------------------------------
# Combined entry point
# ---------------------------------------------------------------------------

def compute_sequence_metrics(sequence: List[str], all_labels: List[str]) -> Dict:
    """Return all sequence-derived metrics for a platform's topic sequence."""
    return {
        "sequence_predictability": sequence_predictability(sequence),
        "turning_points": find_turning_points(sequence, all_labels),
    }
