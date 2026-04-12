# Data Twin

**Data Twin** is a privacy-preserving behavioral analysis tool that builds a model of your digital self from your own data exports — no third-party tracking required.

You upload your **Google Takeout** activity (search/YouTube history) and/or **TikTok data export**, and the app analyzes them to reveal how algorithms see you. It classifies your content history by topic, computes behavioral metrics across platforms, and assigns you one of eight **persona archetypes** (e.g. *The Deep Diver*, *The Scholar*, *The Trend Chaser*) using a k-means clustering model.

## What it surfaces

- Topic distribution and top interests per platform
- Behavioral signals: curiosity, stability, attention fragmentation, algorithmic drift, commercial intent, rabbit-hole depth
- A cross-platform "profilability score" — how predictable and easy to profile your behavior is
- Turning points where your interests shifted

## Stack

- **Backend:** FastAPI + BART-large-MNLI (zero-shot topic classification)
- **Frontend:** React + Vite + Recharts

## Running locally

**Backend**
```bash
cd backend
source ../venv/bin/activate
uvicorn main:app --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and the API at `http://localhost:8000`.  
API docs are available at `http://localhost:8000/docs`.

## Demo mode

No data export? Set `?synthetic=true` on the `/analyze` endpoint (or toggle it in the UI) to run on built-in sample data.
