import type { PersonaResult } from "../lib/personas";
import { PersonaAvatar } from "./PersonaAvatar";

interface Props {
  result: PersonaResult;
}

export function PersonaCard({ result }: Props) {
  const { primary, primaryReasons, secondary, secondaryReasons, mlAssigned, mlConfidence } = result;

  return (
    <div className="flex flex-col gap-3">
      {/* Primary persona */}
      <div
        className={`relative rounded-2xl bg-gradient-to-br ${primary.gradient} border ${primary.borderColor} p-8 overflow-hidden`}
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white opacity-[0.04]" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white opacity-[0.04]" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar illustration */}
          <div className="w-24 h-24 shrink-0 rounded-2xl bg-white/10 backdrop-blur-sm shadow-lg overflow-hidden">
            <PersonaAvatar id={primary.id} className="w-full h-full" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-[11px] font-bold uppercase tracking-[0.15em] ${primary.textColor} opacity-60`}>
                Your online persona
              </p>
              {/* ML badge */}
              {mlAssigned && mlConfidence !== null && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 border border-white/25">
                  <svg className="w-2.5 h-2.5 text-white opacity-80" viewBox="0 0 10 10" fill="currentColor">
                    <circle cx="5" cy="5" r="3.5" />
                    <path d="M5 1v1M5 8v1M1 5h1M8 5h1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
                  </svg>
                  <span className={`text-[10px] font-bold ${primary.textColor} opacity-75`}>
                    ML · {Math.round(mlConfidence * 100)}% match
                  </span>
                </span>
              )}
            </div>

            <h2 className={`text-3xl font-black leading-tight ${primary.textColor}`}>
              {primary.name}
            </h2>
            <p className={`text-sm font-medium italic ${primary.textColor} opacity-85`}>
              "{primary.tagline}"
            </p>
            <p className={`text-sm ${primary.textColor} opacity-75 max-w-xl leading-relaxed`}>
              {primary.description}
            </p>
          </div>
        </div>

        {/* What gave it away */}
        {primaryReasons.length > 0 && (
          <div className="relative mt-6 pt-5 border-t border-white/20">
            <p className={`text-[11px] font-bold uppercase tracking-[0.12em] ${primary.textColor} opacity-50 mb-3`}>
              What gave it away
            </p>
            <div className="flex flex-wrap gap-2">
              {primaryReasons.map((reason, i) => (
                <span
                  key={i}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${primary.pillColor} bg-opacity-70`}
                >
                  {reason}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Secondary persona */}
      {secondary && (
        <div className="flex items-center gap-4 rounded-xl bg-white border border-gray-100 shadow-sm px-5 py-4">
          <div className={`w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br ${secondary.gradient}`}>
            <PersonaAvatar id={secondary.id} className="w-full h-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
              You're also a bit of a…
            </p>
            <p className="text-sm font-bold text-gray-800">{secondary.name}</p>
            {secondaryReasons.length > 0 && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{secondaryReasons[0]}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
