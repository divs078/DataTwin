import type { AnalysisResult } from "./types";

const API_BASE = "http://localhost:8000";

export async function analyzeFiles(
  googleFile?: File,
  tiktokFile?: File
): Promise<AnalysisResult> {
  const form = new FormData();
  if (googleFile) form.append("google_file", googleFile);
  if (tiktokFile) form.append("tiktok_file", tiktokFile);

  const res = await fetch(`${API_BASE}/analyze`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

export async function analyzeSynthetic(): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/analyze?synthetic=true`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}
