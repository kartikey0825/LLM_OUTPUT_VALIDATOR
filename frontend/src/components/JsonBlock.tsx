import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";

export function JsonBlock({ value, maxHeight = "max-h-96" }: { value: unknown; maxHeight?: string }) {
  const [copied, setCopied] = useState(false);
  const text = useMemo(() => (typeof value === "string" ? value : JSON.stringify(value, null, 2)), [value]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={copy}
        className="absolute right-3 top-3 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-slate-100 backdrop-blur transition hover:bg-white/20"
        title="Copy JSON"
      >
        <span className="inline-flex items-center gap-1">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}</span>
      </button>
      <pre className={`pretty-scroll overflow-auto rounded-2xl bg-slate-950 p-4 pr-24 text-xs leading-relaxed text-slate-50 ${maxHeight}`}>
        {text}
      </pre>
    </div>
  );
}
