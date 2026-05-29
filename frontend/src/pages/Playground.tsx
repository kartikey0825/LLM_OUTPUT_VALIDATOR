import { useEffect, useMemo, useState } from "react";
import { Code2, ShieldCheck } from "lucide-react";
import { getSchemas, runValidatedCall } from "../api/client";
import { AttemptTimeline } from "../components/AttemptTimeline";
import { JsonBlock } from "../components/JsonBlock";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import type { Attempt, SchemaDefinition } from "../types";

const samplePrompts: Record<string, string> = {
  invoice_extraction: "Extract invoice details from this invoice: {{invoiceText}}",
  resume_extraction: "Extract resume details including name, email, skills, education, and total years of experience.\n\nResume:\n{{resumeText}}",
  product_review: "Extract product review data from this review: {{reviewText}}"
};

const sampleVariables: Record<string, Record<string, unknown>> = {
  invoice_extraction: { invoiceText: "ABC Pvt Ltd invoice INV-101 total is ₹5000 due tomorrow." },
  resume_extraction: {
    resumeText: "Kartikey Raj\nEmail: kartikey.raj@example.com\nSkills: Python, SQL, React, FastAPI\nEducation: B.Tech CSE\nExperience: 2 years\nBackend Developer at ABC Corp"
  },
  product_review: { reviewText: "I loved the product. Battery is great. Rating 5 out of 5." }
};

type ValidationResult = {
  success: boolean;
  validatedOutput?: unknown;
  attempts?: Attempt[];
  attemptCount: number;
  correctionNeeded: boolean;
  totalLatencyMs: number;
  warnings?: string[];
  message?: string;
};

export function Playground() {
  const [schemas, setSchemas] = useState<SchemaDefinition[]>([]);
  const [schemaName, setSchemaName] = useState("invoice_extraction");
  const [strategy, setStrategy] = useState("few_shot");
  const [model, setModel] = useState("");
  const [prompt, setPrompt] = useState(samplePrompts.invoice_extraction);
  const [variablesText, setVariablesText] = useState(JSON.stringify(sampleVariables.invoice_extraction, null, 2));
  const [safeMode, setSafeMode] = useState(false);
  const [partialRecovery, setPartialRecovery] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);

  useEffect(() => {
    getSchemas()
      .then((data) => {
        setSchemas(data);
        if (data[0] && !schemaName) setSchemaName(data[0].name);
        if (!data.length) setError("No schemas found. Seed the backend or create a schema first.");
      })
      .catch((err) => setError(err.message));
  }, []);

  const selectedSchema = useMemo(() => schemas.find((schema) => schema.name === schemaName), [schemas, schemaName]);

  function handleSchemaChange(name: string) {
    setSchemaName(name);
    setPrompt(samplePrompts[name] ?? "Extract structured data from this text: {{inputText}}");
    setVariablesText(JSON.stringify(sampleVariables[name] ?? { inputText: "Paste sample input here." }, null, 2));
    setResult(null);
    setError("");
  }

  async function handleRun() {
    try {
      setLoading(true);
      setError("");
      let variables: Record<string, unknown> = {};
      if (variablesText.trim()) {
        try {
          variables = JSON.parse(variablesText);
        } catch {
          throw new Error("Variables JSON is invalid. Check quotes, commas, and braces.");
        }
      }

      const response = await runValidatedCall({
        schemaName,
        prompt,
        variables,
        model,
        strategy,
        maxAttempts: 3,
        safeMode,
        partialRecovery
      });
      setResult(response as ValidationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[560px_1fr]">
      <Card>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-700"><Code2 /></div>
          <div>
            <h2 className="text-xl font-bold">Validator Console</h2>
            <p className="text-sm text-slate-500">Submit a request and verify it against the selected contract.</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {error && <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Schema</span>
              <select className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" value={schemaName} onChange={(e) => handleSchemaChange(e.target.value)}>
                {schemas.map((schema) => <option key={schema.id} value={schema.name}>{schema.name}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Model</span>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Leave blank for default"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Output strategy</span>
              <select className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" value={strategy} onChange={(e) => setStrategy(e.target.value)}>
                <option value="json_instruction">JSON instruction</option>
                <option value="few_shot">Few-shot example</option>
                <option value="function_calling">Tool calling</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Prompt template</span>
              <textarea className="mt-2 h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Variables JSON</span>
            <textarea className="pretty-scroll mt-2 h-36 w-full rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 font-mono text-xs leading-relaxed text-white" value={variablesText} onChange={(e) => setVariablesText(e.target.value)} />
          </label>

          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid flex-1 grid-cols-2 gap-3">
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <input type="checkbox" checked={safeMode} onChange={(e) => setSafeMode(e.target.checked)} /> Safe mode
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <input type="checkbox" checked={partialRecovery} onChange={(e) => setPartialRecovery(e.target.checked)} /> Partial recovery
              </label>
            </div>
            <Button onClick={handleRun} disabled={loading || !schemaName || schemas.length === 0} className="min-w-[170px]">
              {loading ? "Validating..." : "Run validation"}
            </Button>
          </div>
        </div>

        {selectedSchema && (
          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Schema difficulty</p>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700">{selectedSchema.difficulty}/10</span>
            </div>
            <div className="mt-3"><JsonBlock value={selectedSchema.schemaJson} maxHeight="max-h-56" /></div>
          </div>
        )}
      </Card>

      <div className="space-y-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><ShieldCheck /></div>
            <div>
              <h2 className="text-xl font-bold">Result</h2>
              <p className="text-sm text-slate-500">Validated responses appear here.</p>
            </div>
          </div>

          {result ? (
            <div className="mt-6 space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs text-slate-500">Status</p><p className={`font-bold ${result.success ? "text-emerald-700" : "text-rose-700"}`}>{result.success ? "Valid" : "Failed"}</p></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs text-slate-500">Attempts</p><p className="font-bold">{result.attemptCount}</p></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs text-slate-500">Latency</p><p className="font-bold">{result.totalLatencyMs} ms</p></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs text-slate-500">Correction</p><p className="font-bold">{result.correctionNeeded ? "Yes" : "No"}</p></div>
              </div>
              {result.warnings && result.warnings.length > 0 && <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">{result.warnings.join(" ")}</div>}
              <JsonBlock value={result.success ? result.validatedOutput : result} />
            </div>
          ) : (
            <p className="mt-6 rounded-2xl bg-slate-50 p-6 text-slate-500">Run a request to see the validated output here.</p>
          )}
        </Card>

        {result?.attempts && (
          <Card>
            <h2 className="text-xl font-bold">Attempt History</h2>
            <p className="mb-4 text-sm text-slate-500">Every retry is captured for review.</p>
            <AttemptTimeline attempts={result.attempts} />
          </Card>
        )}
      </div>
    </div>
  );
}
