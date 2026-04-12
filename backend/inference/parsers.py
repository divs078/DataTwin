"""
Parsers for consent-based data exports.

Supported formats:
- Google Takeout: MyActivity.json (Search), watch-history.json (YouTube)
- TikTok: user_data.json

No data is stored — all parsing happens in memory at request time.
"""

from typing import List, Tuple


def _strip_google_prefix(title: str) -> str:
    """Remove prefixes Google Takeout adds to titles."""
    for prefix in ("Searched for ", "Watched ", "Visited "):
        if title.startswith(prefix):
            return title[len(prefix):]
    return title


def parse_google_activity(data: list) -> List[str]:
    """
    Parse Google MyActivity.json (Search history).
    Format: list of objects with 'title' and 'time' fields.
    """
    texts = []
    for item in data:
        title = item.get("title", "").strip()
        if title:
            texts.append(_strip_google_prefix(title))
    return texts


def parse_youtube_history(data: list) -> List[str]:
    """
    Parse YouTube watch-history.json.
    Format: list of objects with 'title' (video title) and 'time' fields.
    """
    texts = []
    for item in data:
        title = item.get("title", "").strip()
        if title:
            texts.append(_strip_google_prefix(title))
    return texts


def parse_google_file(data) -> List[str]:
    """
    Auto-detect and parse a Google Takeout JSON file.
    Distinguishes between MyActivity.json and watch-history.json by
    checking if titleUrl points to youtube.com.
    """
    if not isinstance(data, list) or not data:
        return []

    sample = data[0]
    if "titleUrl" in sample and "youtube.com" in sample.get("titleUrl", ""):
        return parse_youtube_history(data)

    return parse_google_activity(data)


def parse_tiktok_history(data: dict) -> List[str]:
    """
    Parse TikTok user_data.json.

    TikTok exports do NOT include video titles in watch history (only URLs),
    so we extract text from: searches, hashtags interacted with, and comments.
    """
    if not isinstance(data, dict):
        return []

    texts = []
    activity = data.get("Activity", {})

    # Search history — most valuable signal
    search_list = activity.get("Search History", {}).get("SearchList", [])
    for item in search_list:
        query = (item.get("SearchTerm") or item.get("searchTerm") or "").strip()
        if query:
            texts.append(query)

    # Hashtags — inferred topic signal
    hashtag_list = activity.get("Hashtag", {}).get("HashtagList", [])
    for item in hashtag_list:
        tag = (item.get("HashtagName") or item.get("hashtagName") or "").strip()
        if tag:
            # Convert #clean_girl_aesthetic → "clean girl aesthetic"
            texts.append(tag.lstrip("#").replace("_", " "))

    # Comments — user-generated text signal
    comment_list = activity.get("Comment", {}).get("CommentsList", [])
    for item in comment_list:
        comment = (item.get("Comment") or "").strip()
        if comment:
            texts.append(comment)

    return texts


def get_synthetic_data() -> Tuple[List[str], List[str]]:
    """
    Built-in synthetic data for demo/testing.
    Represents a user with tech-heavy Google behavior and lifestyle TikTok behavior.
    """
    google = [
        "machine learning tutorial for beginners",
        "latest developments in AI research",
        "best Python libraries for data science",
        "EU AI Act regulations 2024",
        "how neural networks learn",
        "climate change data visualization",
        "remote work productivity tools",
        "investment strategies for young professionals",
        "best budget laptops for coding",
        "open source LLM alternatives to GPT",
        "how to negotiate salary tech industry",
        "data privacy laws by country",
        "deep learning vs machine learning difference",
        "healthy meal prep ideas for busy people",
        "best podcasts for tech founders",
        "reinforcement learning from human feedback",
        "vector databases explained",
        "startup equity explained",
        "best standing desks under 500",
        "how to read research papers faster",
    ]

    tiktok = [
        "low rise jeans outfit ideas",
        "clean girl makeup tutorial",
        "how to glow up fast",
        "morning routine aesthetic",
        "what I eat in a day",
        "gym aesthetic workout motivation",
        "thrift flip fashion DIY",
        "skincare routine for acne",
        "viral pasta recipe",
        "best travel destinations 2024",
        "apartment decoration ideas small space",
        "self care sunday routine",
        "manifestation tips that actually work",
        "luxury brand dupes affordable",
        "pilates workout at home",
        "cottagecore aesthetic outfits",
        "budget beauty products",
        "hair care routine for growth",
        "aesthetic desk setup",
        "no spend challenge tips",
    ]

    return google, tiktok
