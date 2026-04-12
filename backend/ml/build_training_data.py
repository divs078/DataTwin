"""
Build a labeled training corpus for the fine-tuned topic classifier.

Strategy: knowledge distillation from BART-MNLI.
  1. Start with a curated set of seed texts per topic.
  2. Use BART-MNLI to score every seed text against all 8 labels.
  3. Keep only high-confidence labels (score > threshold).
  4. Save to ml/data/training_data.jsonl.

Run once before train_classifier.py:
    cd backend
    python -m ml.build_training_data

Requires the BART-MNLI model (same one already used by classifier.py).
First run will download it if not cached (~1.5 GB).
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

CONFIDENCE_THRESHOLD = 0.60
OUTPUT_FILE = Path(__file__).parent / "data" / "training_data.jsonl"

# ---------------------------------------------------------------------------
# Seed texts — representative examples per topic.
# Covers: search queries, video titles, article headlines, hashtags, comments.
# Deliberately varied in phrasing to improve generalisation.
# ---------------------------------------------------------------------------

SEED_TEXTS: dict[str, list[str]] = {
    "technology": [
        "best Python libraries for machine learning",
        "how does a transformer neural network work",
        "open source alternatives to ChatGPT",
        "how to set up a home server with Raspberry Pi",
        "React vs Vue for frontend development 2024",
        "what is quantum computing explained simply",
        "GitHub Copilot review for developers",
        "how to learn programming from scratch",
        "vector databases and embeddings explained",
        "top AI tools for productivity",
        "Linux vs macOS for developers",
        "how LLMs generate text step by step",
        "best mechanical keyboards for coding",
        "TypeScript tutorial for beginners",
        "building a REST API with FastAPI",
        "Docker explained for beginners",
        "how to use git branches effectively",
        "best VS Code extensions 2024",
        "cloud computing AWS vs GCP",
        "what is a neural network",
    ],
    "fashion": [
        "clean girl aesthetic outfit ideas",
        "how to style wide leg jeans",
        "best thrift stores near me",
        "capsule wardrobe essentials for women",
        "how to dress for your body type",
        "Y2K fashion comeback trends 2024",
        "luxury brand dupes that look expensive",
        "cottagecore aesthetic outfits inspiration",
        "how to style blazers casually",
        "best affordable online clothing stores",
        "dark academia wardrobe guide",
        "summer street style inspo",
        "how to build a minimal wardrobe",
        "vintage fashion finds haul",
        "how to care for linen clothing",
        "what to wear to a job interview 2024",
        "color combinations that always look good",
        "GRWM first day of work outfit",
        "oversized shirt outfit ideas",
        "fashion week highlights 2024",
    ],
    "politics": [
        "EU AI Act regulations explained",
        "how does the US electoral college work",
        "climate policy debate summary",
        "immigration reform news 2024",
        "what is universal basic income",
        "NATO expansion latest updates",
        "how laws are passed in Congress",
        "Supreme Court decisions this year",
        "political polarization causes and effects",
        "what does the Federal Reserve actually do",
        "democracy vs authoritarian government differences",
        "voter suppression laws explained",
        "what is gerrymandering and why it matters",
        "international trade agreements 2024",
        "government surveillance privacy debate",
        "how social media influences elections",
        "free speech vs hate speech laws",
        "climate change policy Paris Agreement",
        "universal healthcare pros and cons",
        "election integrity debate explained",
    ],
    "finance": [
        "how to invest in index funds for beginners",
        "what is dollar cost averaging",
        "high yield savings account best rates",
        "how to pay off student loans faster",
        "Roth IRA vs traditional IRA explained",
        "cryptocurrency investing risks and benefits",
        "how to build an emergency fund",
        "passive income ideas that actually work",
        "how does compound interest work",
        "best budgeting apps 2024",
        "real estate investing for beginners",
        "how to negotiate salary successfully",
        "what is a 401k and how does it work",
        "stock market basics for beginners",
        "how to improve your credit score fast",
        "financial independence retire early FIRE movement",
        "side hustle income tax guide",
        "how to diversify an investment portfolio",
        "what is inflation and how it affects you",
        "startup equity vesting explained",
    ],
    "self improvement": [
        "how to build a morning routine that sticks",
        "atomic habits book summary key lessons",
        "how to stop procrastinating effectively",
        "journaling prompts for self reflection",
        "how to improve focus and concentration",
        "meditation for beginners 10 minutes",
        "how to wake up early and feel good",
        "growth mindset vs fixed mindset",
        "how to set goals you will actually achieve",
        "daily habits of highly successful people",
        "how to be more disciplined",
        "overcoming imposter syndrome tips",
        "time blocking productivity technique",
        "how to read more books in a year",
        "building confidence from scratch",
        "manifestation and visualization techniques",
        "how to manage anxiety naturally",
        "learning new skills faster techniques",
        "deep work book summary Cal Newport",
        "how to stop negative self talk",
    ],
    "entertainment": [
        "best movies on Netflix right now",
        "top 10 anime to watch in 2024",
        "Stranger Things season 5 theories",
        "best video games to play right now",
        "Taylor Swift Eras tour highlights",
        "Oscar nominated films 2024",
        "best comedy specials on streaming",
        "new music releases this week",
        "Marvel phase 5 upcoming movies",
        "reality TV drama recap",
        "best podcasts for long drives",
        "Beyonce album review",
        "most anticipated games of 2024",
        "celebrity news roundup",
        "viral moments from award shows",
        "best horror movies to watch tonight",
        "K-drama recommendations for beginners",
        "Nintendo Switch hidden gems",
        "Spotify wrapped top songs 2024",
        "new book releases bestsellers list",
    ],
    "health": [
        "how to lose weight without dieting",
        "best foods for gut health",
        "how much sleep do you actually need",
        "beginner workout routine at home",
        "intermittent fasting beginner guide",
        "symptoms of vitamin D deficiency",
        "how to reduce inflammation naturally",
        "mental health tips for anxiety",
        "best protein sources for vegetarians",
        "how to improve posture at a desk",
        "what is zone 2 cardio training",
        "hydration how much water per day",
        "pilates beginner full body workout",
        "how to build muscle for beginners",
        "natural remedies for better sleep",
        "what happens to your body when you quit sugar",
        "how to recover from burnout",
        "daily steps goal for weight loss",
        "benefits of cold showers",
        "cortisol levels and stress management",
    ],
    "travel": [
        "best budget travel destinations 2024",
        "how to find cheap flights tips",
        "solo travel safety tips for women",
        "hidden gems in Southeast Asia",
        "best travel credit cards for beginners",
        "packing light carry on only guide",
        "travel itinerary Japan 2 weeks",
        "digital nomad best cities to live",
        "travel hacks to save money on trips",
        "best hostels in Europe for solo travelers",
        "visa requirements for US passport holders",
        "overrated tourist traps to avoid",
        "travel insurance worth it or not",
        "things to do in Lisbon Portugal",
        "slow travel movement explained",
        "best time to visit Southeast Asia",
        "road trip essentials packing list",
        "how to travel full time on a budget",
        "underrated cities in Eastern Europe",
        "luxury travel on a budget tips",
    ],
}


def build(threshold: float = CONFIDENCE_THRESHOLD) -> int:
    """Label all seed texts with BART-MNLI and save high-confidence examples."""
    try:
        from transformers import pipeline as hf_pipeline
    except ImportError:
        print("transformers is required. Install with: pip install transformers")
        sys.exit(1)

    labels = list(SEED_TEXTS.keys())
    print("Loading BART-MNLI…")
    classifier = hf_pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    total, kept = 0, 0

    with open(OUTPUT_FILE, "w") as f:
        for true_label, texts in SEED_TEXTS.items():
            for text in texts:
                total += 1
                result = classifier(text, labels)
                scores = dict(zip(result["labels"], result["scores"]))
                predicted = result["labels"][0]
                confidence = result["scores"][0]

                # Keep if BART agrees with our intended label at high confidence
                if predicted == true_label and confidence >= threshold:
                    record = {
                        "text": text,
                        "label": true_label,
                        "label_id": labels.index(true_label),
                        "confidence": round(confidence, 4),
                    }
                    f.write(json.dumps(record) + "\n")
                    kept += 1
                    print(f"  ✓ [{true_label}] {text[:60]}… ({confidence:.2f})")
                else:
                    print(
                        f"  ✗ [{true_label}→{predicted}] {text[:60]}… ({confidence:.2f})"
                    )

    print(f"\nKept {kept}/{total} examples (threshold={threshold})")
    print(f"Saved to {OUTPUT_FILE}")
    return kept


if __name__ == "__main__":
    build()
