import { CheckCircle2, XCircle } from "lucide-react";
import type { Attempt } from "../types";
import { JsonBlock } from "./JsonBlock";

export function AttemptTimeline({ attempts }: { attempts: Attempt[] }) {
  if (!attempts?.length) return null;
  return (
    <div className="space-y-4">
      {attempts.map((attempt) => (
        <div key={attempt.id ?? attempt.attemptNumber} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {attempt.valid ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-rose-600" />}
              <h3 className="font-semibold text-slate-900">Attempt {attempt.attemptNumber}</h3>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">{attempt.latencyMs} ms</span>
          </div>
          {attempt.validationError && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{attempt.validationError}</p>}
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Raw Response</p>
              <JsonBlock value={attempt.rawResponse} maxHeight="max-h-56" />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Parsed JSON</p>
              <JsonBlock value={attempt.parsedJson ?? "Not parsed"} maxHeight="max-h-56" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
