import { useState, useRef, useCallback } from "react";
import { analyzeFiles, analyzeSynthetic } from "../api";
import type { AnalysisResult } from "../types";
import { PersonaAvatar } from "./PersonaAvatar";
import { classifyPersona } from "../lib/personas";

interface OnboardingProps {
  onComplete: (result: AnalysisResult) => void;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const STEP_LABELS = ["welcome", "google", "tiktok", "upload", "done!"];

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8 px-2">
      {STEP_LABELS.map((label, i) => {
        const num = i + 1;
        const isDone   = num < step;
        const isCurrent = num === step;
        return (
          <div key={num} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500
                  ${isDone    ? "bg-purple-500 text-white shadow-md shadow-purple-200"    : ""}
                  ${isCurrent ? "bg-purple-600 text-white shadow-lg shadow-purple-300 scale-110" : ""}
                  ${!isDone && !isCurrent ? "bg-purple-100 text-purple-300" : ""}`}
              >
                {isDone ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : num}
              </div>
              <span className={`text-[10px] font-medium tracking-tight transition-colors duration-300
                ${isCurrent ? "text-purple-600" : isDone ? "text-purple-400" : "text-purple-200"}`}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`w-8 h-1 mx-1 rounded-full mb-4 transition-all duration-500
                ${num < step ? "bg-purple-400" : "bg-purple-100"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tip Bubble ───────────────────────────────────────────────────────────────

function TipBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mt-4">
      <span className="text-lg shrink-0">💡</span>
      <p className="text-sm text-amber-700 leading-snug">{children}</p>
    </div>
  );
}

// ─── Step instruction row ─────────────────────────────────────────────────────

function StepRow({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {num}
      </div>
      <p className="text-sm text-gray-600 leading-snug">{children}</p>
    </div>
  );
}

// ─── Upload Drop Zone ─────────────────────────────────────────────────────────

interface DropZoneProps {
  label: string;
  hint: string;
  file: File | null;
  onChange: (f: File | null) => void;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  icon: React.ReactNode;
}

function DropZone({ label, hint, file, onChange, colorClass, bgClass, borderClass, icon }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onChange(f);
  }, [onChange]);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-5 cursor-pointer transition-all duration-200
        ${file    ? `${borderClass} ${bgClass}`                           : ""}
        ${dragging ? `${borderClass} ${bgClass} scale-[1.02]`             : ""}
        ${!file && !dragging ? "border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-purple-50" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".json,.zip"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />

      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors
        ${file ? bgClass : "bg-gray-100"}`}>
        {file ? (
          <svg className={`w-6 h-6 ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : icon}
      </div>

      <div className="text-center">
        <p className={`text-sm font-semibold ${file ? colorClass : "text-gray-600"}`}>{label}</p>
        {file ? (
          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">{file.name}</p>
        ) : (
          <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
        )}
      </div>

      {file && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onChange(null);
            if (inputRef.current) inputRef.current.value = "";
          }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
        >
          <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── Main Onboarding Component ────────────────────────────────────────────────

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep]           = useState(1);
  const [animating, setAnimating] = useState(false);
  const [googleFile, setGoogleFile] = useState<File | null>(null);
  const [tiktokFile, setTiktokFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing]   = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [result, setResult]         = useState<AnalysisResult | null>(null);

  function goTo(next: number) {
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 280);
  }

  async function handleAnalyze(useDemoData = false) {
    setAnalyzing(true);
    setError(null);
    try {
      const data = useDemoData
        ? await analyzeSynthetic()
        : await analyzeFiles(googleFile ?? undefined, tiktokFile ?? undefined);
      setResult(data);
      goTo(5);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong — try again!");
    } finally {
      setAnalyzing(false);
    }
  }

  const canAnalyze = (googleFile !== null || tiktokFile !== null) && !analyzing;

  // ── Shared button ──
  function PrimaryBtn({
    onClick, disabled = false, children
  }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-violet-500 text-white font-bold text-base
          shadow-lg shadow-purple-200 hover:shadow-purple-300 hover:from-purple-600 hover:to-violet-600
          disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-200"
      >
        {children}
      </button>
    );
  }

  function SecondaryBtn({
    onClick, children
  }: { onClick: () => void; children: React.ReactNode }) {
    return (
      <button
        onClick={onClick}
        className="w-full py-3.5 rounded-2xl border-2 border-purple-200 text-purple-500 font-semibold text-sm
          hover:bg-purple-50 active:scale-[0.98] transition-all duration-200"
      >
        {children}
      </button>
    );
  }

  // ── Screens ──────────────────────────────────────────────────────────────────

  function Screen1() {
    return (
      <div className="flex flex-col items-center text-center gap-5">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-200">
          <span className="text-5xl">✨</span>
        </div>

        <div className="space-y-2">
          <div className="inline-block bg-purple-100 text-purple-600 text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase">
            new ✦ meet your ai twin
          </div>
          <h1 className="text-3xl font-black text-gray-900 leading-tight tracking-tight">
            your digital life,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
              decoded ✨
            </span>
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
            upload your google + tiktok data exports and we'll build a behavioral AI model of your digital self — in minutes.
          </p>
        </div>

        <div className="w-full space-y-3">
          <PrimaryBtn onClick={() => goTo(2)}>
            let's get started →
          </PrimaryBtn>
          <p className="text-xs text-gray-400">your files never leave your device 🔒</p>
        </div>
      </div>
    );
  }

  function Screen2() {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
            {/* Google "G" */}
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="white" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="white" fillOpacity="0.85" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="white" fillOpacity="0.7" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">step 1 of 2</p>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
              grab your google data 🔍
            </h2>
          </div>
        </div>

        <p className="text-sm text-gray-500">follow these steps — takes about 5 mins</p>

        <div className="bg-blue-50 rounded-2xl p-4 space-y-3.5 border border-blue-100">
          <StepRow num={1}>
            Go to{" "}
            <span className="font-semibold text-blue-600">takeout.google.com</span>
          </StepRow>
          <StepRow num={2}>
            Click <strong>Deselect all</strong>, then scroll to find{" "}
            <strong>YouTube and YouTube Music</strong> and check it
          </StepRow>
          <StepRow num={3}>
            Under YouTube, make sure <strong>history</strong> is checked
          </StepRow>
          <StepRow num={4}>
            Choose <strong>Export once → JSON format</strong>, then hit Create Export
          </StepRow>
          <StepRow num={5}>
            Download the ZIP and find{" "}
            <code className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs">watch-history.json</code>
          </StepRow>
        </div>

        <TipBubble>
          google usually emails you the download link within a few minutes!
        </TipBubble>

        <div className="space-y-2 pt-1">
          <PrimaryBtn onClick={() => goTo(3)}>got it, next →</PrimaryBtn>
          <SecondaryBtn onClick={() => goTo(3)}>skip for now</SecondaryBtn>
        </div>
      </div>
    );
  }

  function Screen3() {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center shadow-md shadow-gray-300 shrink-0">
            {/* TikTok note icon */}
            <span className="text-2xl">🎵</span>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-pink-500 uppercase tracking-widest">step 2 of 2</p>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
              snag that tiktok data 🎵
            </h2>
          </div>
        </div>

        <p className="text-sm text-gray-500">request your data export from the app</p>

        <div className="bg-pink-50 rounded-2xl p-4 space-y-3.5 border border-pink-100">
          <StepRow num={1}>
            Open TikTok → tap your <strong>Profile</strong> → tap ☰ top right
          </StepRow>
          <StepRow num={2}>
            Go to <strong>Settings and privacy → Privacy</strong>
          </StepRow>
          <StepRow num={3}>
            Scroll down and tap <strong>Download your data</strong>
          </StepRow>
          <StepRow num={4}>
            Select <strong>JSON format</strong> and tap Request Data
          </StepRow>
          <StepRow num={5}>
            TikTok emails you a link — download and find{" "}
            <code className="bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded text-xs">user_data.json</code>
          </StepRow>
        </div>

        <TipBubble>
          TikTok exports can take up to 24 hours — you can skip this and just upload your Google data for now!
        </TipBubble>

        <div className="space-y-2 pt-1">
          <PrimaryBtn onClick={() => goTo(4)}>requested it ✓</PrimaryBtn>
          <SecondaryBtn onClick={() => goTo(4)}>skip for now</SecondaryBtn>
        </div>
      </div>
    );
  }

  function Screen4() {
    return (
      <div className="flex flex-col gap-5">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
            drop your files here 📂
          </h2>
          <p className="text-sm text-gray-500">
            your files are processed locally — pinky promise 🤙
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DropZone
            label="Google Data"
            hint="watch-history.json"
            file={googleFile}
            onChange={setGoogleFile}
            colorClass="text-blue-600"
            bgClass="bg-blue-50"
            borderClass="border-blue-400"
            icon={
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            }
          />
          <DropZone
            label="TikTok Data"
            hint="user_data.json"
            file={tiktokFile}
            onChange={setTiktokFile}
            colorClass="text-pink-600"
            bgClass="bg-pink-50"
            borderClass="border-pink-400"
            icon={
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            }
          />
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
            <span>😬</span> {error}
          </div>
        )}

        <div className="space-y-2 pt-1">
          {analyzing ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-3 h-3 rounded-full bg-purple-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <p className="text-sm text-gray-500 font-medium">building your digital twin…</p>
              <p className="text-xs text-gray-400">first run downloads the AI model (~1.5 GB)</p>
            </div>
          ) : (
            <>
              <PrimaryBtn onClick={() => handleAnalyze(false)} disabled={!canAnalyze}>
                analyze me 🔮
              </PrimaryBtn>
              <button
                onClick={() => handleAnalyze(true)}
                className="w-full py-3 text-sm text-gray-400 hover:text-purple-500 transition-colors font-medium"
              >
                or try with demo data instead →
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  function Screen5() {
    const persona = result ? classifyPersona(result) : null;
    return (
      <div className="flex flex-col items-center text-center gap-6">
        {persona && (
          <div className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${persona.primary.gradient} shadow-xl overflow-hidden`}>
            <PersonaAvatar id={persona.primary.id} className="w-full h-full" />
          </div>
        )}

        <div className="space-y-2">
          <div className="inline-block bg-emerald-100 text-emerald-600 text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase">
            your twin is alive ✦
          </div>
          <h2 className="text-3xl font-black text-gray-900 leading-tight tracking-tight">
            {persona ? persona.primary.name : "analysis complete!"} 🎉
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto italic">
            {persona ? `"${persona.primary.tagline}"` : "we've built a behavioral model from your data."}
          </p>
        </div>

        {result && (
          <div className="w-full grid grid-cols-2 gap-3">
            {result.google && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-center">
                <p className="text-2xl font-black text-blue-600">
                  {result.google.top_topics?.length ?? 0}
                </p>
                <p className="text-xs text-blue-400 font-medium mt-0.5">google topics</p>
              </div>
            )}
            {result.tiktok && (
              <div className="bg-pink-50 border border-pink-100 rounded-2xl p-3 text-center">
                <p className="text-2xl font-black text-pink-600">
                  {result.tiktok.top_topics?.length ?? 0}
                </p>
                <p className="text-xs text-pink-400 font-medium mt-0.5">tiktok topics</p>
              </div>
            )}
          </div>
        )}

        <PrimaryBtn onClick={() => result && onComplete(result)}>
          see my digital twin →
        </PrimaryBtn>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const screens: Record<number, React.ReactNode> = {
    1: <Screen1 />,
    2: <Screen2 />,
    3: <Screen3 />,
    4: <Screen4 />,
    5: <Screen5 />,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 flex flex-col items-center justify-start px-4 py-8">
      {/* Brand header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-purple-200">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <span className="text-base font-black text-gray-900 tracking-tight">data twin</span>
      </div>

      {/* Progress bar */}
      <ProgressBar step={step} />

      {/* Card */}
      <div className="w-full max-w-sm">
        <div
          className={`bg-white rounded-3xl shadow-xl shadow-purple-100/60 p-6 border border-purple-50
            transition-all duration-280 ease-out
            ${animating ? "opacity-0 translate-y-3 scale-[0.98]" : "opacity-100 translate-y-0 scale-100"}`}
        >
          {screens[step]}
        </div>

        {/* Back link */}
        {step > 1 && step < 5 && (
          <button
            onClick={() => goTo(step - 1)}
            className="mt-4 w-full text-center text-xs text-gray-400 hover:text-purple-400 transition-colors"
          >
            ← go back
          </button>
        )}
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-gray-300 text-center">
        built with ♡ for your privacy — no servers, no storage
      </p>
    </div>
  );
}
