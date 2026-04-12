import { useRef } from "react";

interface Props {
  label: string;
  hint: string;
  file: File | null;
  onChange: (f: File | null) => void;
  accent: string;
}

export function FileUpload({ label, hint, file, onChange, accent }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors
        ${file ? `border-${accent}-400 bg-${accent}-50` : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${file ? `bg-${accent}-100` : "bg-gray-200"}`}>
        <svg className={`w-5 h-5 ${file ? `text-${accent}-600` : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {file
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />}
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        {file
          ? <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[180px]">{file.name}</p>
          : <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      {file && (
        <button
          onClick={(e) => { e.stopPropagation(); onChange(null); if (inputRef.current) inputRef.current.value = ""; }}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
