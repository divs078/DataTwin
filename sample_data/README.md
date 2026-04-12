# Sample Data

These files demonstrate the expected format for uploads to the `/analyze` endpoint.

## Files

### `google_MyActivity.json`
Matches the format of **Google Takeout → My Activity → Search** (`MyActivity.json`).
Each item has a `title` (prefixed with "Searched for ", "Watched ", or "Visited ") and a `time` field.

**How to get your own:** Google Takeout → select "My Activity" → export → open the Search subfolder.

### `tiktok_user_data.json`
Matches the format of a **TikTok data export** (`user_data.json`).
Contains `Activity.Search History.SearchList`, `Activity.Hashtag.HashtagList`, and `Activity.Comment.CommentsList`.

**How to get your own:** TikTok → Profile → Settings → Privacy → Personalization and Data → Download your data → select JSON format.

## Running with sample data

```bash
# From the project root
cd backend
uvicorn main:app --reload

# Then POST the sample files:
curl -X POST http://localhost:8000/analyze \
  -F "google_file=@../sample_data/google_MyActivity.json" \
  -F "tiktok_file=@../sample_data/tiktok_user_data.json"

# Or use the synthetic demo (no files needed):
curl "http://localhost:8000/analyze?synthetic=true"
```
