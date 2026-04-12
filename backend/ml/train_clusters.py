"""
Train k-means persona clusters and save the result.

Run once (or whenever you have new user data):
    cd backend
    python -m ml.train_clusters

What this does:
  1. Generates N synthetic user behavioral vectors per cluster, centred on
     the domain-knowledge seed centroids with Gaussian noise.
  2. Trains sklearn KMeans (k=8) initialised from those seed centroids.
  3. Maps each learned centroid back to the nearest seed persona name.
  4. Saves the result to ml/data/cluster_centroids.json.

When you have real user data, replace or augment the synthetic samples
with real behavioral vectors before running this script.
"""

import json
import sys
from pathlib import Path

import numpy as np

# Allow running as `python -m ml.train_clusters` from the backend directory
sys.path.insert(0, str(Path(__file__).parent.parent))

from ml.persona_clusters import SEED_CENTROIDS  # noqa: E402

try:
    from sklearn.cluster import KMeans
except ImportError:
    print("scikit-learn is required. Install it with: pip install scikit-learn")
    sys.exit(1)

OUTPUT_FILE = Path(__file__).parent / "data" / "cluster_centroids.json"
N_SAMPLES_PER_CLUSTER = 200
NOISE_STD = 0.08
RANDOM_SEED = 42


def generate_synthetic_data(
    seed_centroids: dict,
    n_per_cluster: int,
    noise_std: float,
    rng: np.random.Generator,
) -> tuple[np.ndarray, list[str]]:
    """
    Sample synthetic behavioral vectors around each seed centroid.
    Each sample is centroid + Gaussian noise, clipped to [0, 1].
    """
    X, labels = [], []
    for cluster_id, info in seed_centroids.items():
        centroid = np.array(info["centroid"], dtype=float)
        samples = rng.normal(loc=centroid, scale=noise_std, size=(n_per_cluster, len(centroid)))
        samples = np.clip(samples, 0.0, 1.0)
        X.append(samples)
        labels.extend([cluster_id] * n_per_cluster)
    return np.vstack(X), labels


def train(n_per_cluster: int = N_SAMPLES_PER_CLUSTER, noise_std: float = NOISE_STD) -> dict:
    rng = np.random.default_rng(RANDOM_SEED)
    cluster_ids = list(SEED_CENTROIDS.keys())

    print(f"Generating {n_per_cluster} synthetic users per cluster ({len(cluster_ids)} clusters)…")
    X, _ = generate_synthetic_data(SEED_CENTROIDS, n_per_cluster, noise_std, rng)

    # Initialise KMeans from seed centroids so the solution stays interpretable
    init_centroids = np.array(
        [SEED_CENTROIDS[cid]["centroid"] for cid in cluster_ids], dtype=float
    )

    print("Training KMeans…")
    km = KMeans(
        n_clusters=len(cluster_ids),
        init=init_centroids,
        n_init=1,
        max_iter=500,
        random_state=RANDOM_SEED,
    )
    km.fit(X)

    # Map each learned centroid back to the nearest seed persona
    learned_centroids = km.cluster_centers_
    result = {}
    used_ids: set[str] = set()

    for learned_vec in learned_centroids:
        best_id, best_dist = None, float("inf")
        for cid in cluster_ids:
            if cid in used_ids:
                continue
            seed_vec = np.array(SEED_CENTROIDS[cid]["centroid"])
            d = float(np.linalg.norm(learned_vec - seed_vec))
            if d < best_dist:
                best_dist, best_id = d, cid

        used_ids.add(best_id)
        result[best_id] = {
            "centroid": learned_vec.tolist(),
            "name": SEED_CENTROIDS[best_id]["name"],
            "description": SEED_CENTROIDS[best_id]["description"],
        }

    inertia = km.inertia_
    print(f"Done. Inertia: {inertia:.4f}")
    print("Learned centroids:")
    for cid, info in result.items():
        print(f"  {cid}: {[round(x, 3) for x in info['centroid']]}")

    return result


def save(result: dict) -> None:
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        json.dump(result, f, indent=2)
    print(f"\nSaved to {OUTPUT_FILE}")


if __name__ == "__main__":
    result = train()
    save(result)
