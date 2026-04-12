import { useState } from "react";
import type { AnalysisResult } from "./types";
import { Onboarding } from "./components/Onboarding";
import { PlatformPanel } from "./components/PlatformPanel";
import { CrossPlatformPanel } from "./components/CrossPlatformPanel";
import { PersonaCard } from "./components/PersonaCard";
import { classifyPersona } from "./lib/personas";

export default function App() {
  const [result, setResult]           = useState<AnalysisResult | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);

  function handleOnboardingComplete(r: AnalysisResult) {
    setResult(r);
    setShowOnboarding(false);
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-none">Data Twin</h1>
              <p className="text-xs text-gray-400">Behavioral modeling from your own data</p>
            </div>
          </div>

          <button
            onClick={() => setShowOnboarding(true)}
            className="text-xs text-gray-400 hover:text-purple-500 transition-colors font-medium"
          >
            ← start over
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-8">
        {result && (
          <>
            <PersonaCard result={classifyPersona(result)} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <PlatformPanel name="Google" report={result.google} color="bg-blue-500" />
              </section>
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <PlatformPanel name="TikTok" report={result.tiktok} color="bg-pink-500" />
              </section>
            </div>

            {result.cross_platform && Object.keys(result.cross_platform).length > 0 && (
              <CrossPlatformPanel cross={result.cross_platform} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
