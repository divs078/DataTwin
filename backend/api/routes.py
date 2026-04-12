from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from typing import Optional
import json

from inference.pipeline import run_pipeline
from inference.parsers import parse_google_file, parse_tiktok_history, get_synthetic_data

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok"}


@router.post("/analyze")
async def analyze(
    google_file: Optional[UploadFile] = File(None),
    tiktok_file: Optional[UploadFile] = File(None),
    synthetic: bool = Query(False, description="Use built-in synthetic data for demo/testing"),
):
    """
    Analyze behavioral patterns from Google Takeout and/or TikTok data exports.

    Accepted files:
    - google_file: MyActivity.json (Search) or watch-history.json (YouTube) from Google Takeout
    - tiktok_file: user_data.json from TikTok data export

    Set synthetic=true to run on built-in sample data without uploading files.
    """
    if synthetic:
        google_texts, tiktok_texts = get_synthetic_data()
    else:
        if google_file is None and tiktok_file is None:
            raise HTTPException(
                status_code=400,
                detail="Upload at least one file, or set ?synthetic=true to run a demo.",
            )

        google_texts, tiktok_texts = [], []

        if google_file:
            raw = await google_file.read()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                raise HTTPException(status_code=422, detail="google_file must be valid JSON.")
            google_texts = parse_google_file(data)

        if tiktok_file:
            raw = await tiktok_file.read()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                raise HTTPException(status_code=422, detail="tiktok_file must be valid JSON.")
            tiktok_texts = parse_tiktok_history(data)

    if not google_texts and not tiktok_texts:
        raise HTTPException(
            status_code=422,
            detail="No usable text extracted from the uploaded files. Check the file format.",
        )

    return run_pipeline(google_texts, tiktok_texts)
