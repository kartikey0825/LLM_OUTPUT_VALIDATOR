import { useEffect, useState } from "react";
import { Database, Plus, Trash2 } from "lucide-react";
import { createSchema, deleteSchema, getSchemas } from "../api/client";
import { JsonBlock } from "../components/JsonBlock";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import type { SchemaDefinition } from "../types";

const defaultSchema = JSON.stringify({
  name: "lead_scoring",
  description: "Score a sales lead",
  schema: {
    companyName: { type: "string", required: true },
    score: { type: "number", required: true, min: 0, max: 100 },
    priority: { type: "enum", values: ["low", "medium", "high"], required: true },
    reasons: { type: "array", items: "string", required: true }
  }
}, null, 2);

export function Schemas() {
  const [schemas, setSchemas] = useState<SchemaDefinition[]>([]);
  const [schemaText, setSchemaText] = useState(defaultSchema);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setError("");
      setSchemas(await getSchemas());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load schemas. Is the backend running on port 4000?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function submit() {
    try {
      setError("");
      const payload = JSON.parse(schemaText);
      await createSchema(payload);
      setMessage("Schema saved successfully.");
      await load();
    } catch (err) {
      setMessage("");
      setError(err instanceof Error ? err.message : "Invalid schema");
    }
  }

  async function remove(name: string) {
    if (!window.confirm(`Delete schema "${name}"? This cannot be undone.`)) return;
    try {
      setError("");
      await deleteSchema(name);
      setMessage(`Deleted ${name}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete schema.");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[440px_1fr]">
      <Card>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-violet-50 p-3 text-violet-700"><Plus /></div>
          <div>
            <h2 className="text-xl font-bold">Register Schema</h2>
            <p className="text-sm text-slate-500">Create and manage reusable response contracts.</p>
          </div>
        </div>
        <textarea className="mt-6 h-[520px] w-full rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs text-slate-50" value={schemaText} onChange={(e) => setSchemaText(e.target.value)} />
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <button type="button" className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-200" onClick={() => setSchemaText(defaultSchema)}>Load lead scoring sample</button>
          <button type="button" className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-200" onClick={() => setSchemaText(JSON.stringify({ name: "support_ticket", description: "Classify support tickets", schema: { ticketTitle: { type: "string", required: true }, urgency: { type: "enum", values: ["low", "medium", "high"], required: true }, customer: { type: "object", required: true, fields: { name: { type: "string", required: true }, plan: { type: "enum", values: ["free", "pro", "enterprise"], required: false } } }, actions: { type: "array", required: true, items: { type: "object", fields: { owner: { type: "string", required: true }, task: { type: "string", required: true } } } } } }, null, 2))}>Load nested object sample</button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={submit}>Save schema</Button>
          {message && <span className="text-sm text-emerald-700">{message}</span>}
          {error && <span className="text-sm text-rose-700">{error}</span>}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-700"><Database /></div>
          <div>
            <h2 className="text-xl font-bold">Schema Registry</h2>
            <p className="text-sm text-slate-500">Stored schemas with difficulty score.</p>
          </div>
        </div>
        {loading && <p className="mt-6 rounded-2xl bg-slate-50 p-4 text-slate-500">Loading schemas...</p>}
        <div className="mt-6 space-y-4">
          {!loading && schemas.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No schemas yet. Save a schema on the left or run the seed command from the README.
            </div>
          )}
          {schemas.map((schema) => (
            <div key={schema.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-950">{schema.name}</h3>
                  <p className="text-sm text-slate-500">{schema.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">Difficulty {schema.difficulty}/10</span>
                  <button className="rounded-full bg-white p-2 text-rose-600 shadow-sm hover:bg-rose-50" onClick={() => remove(schema.name)} title={`Delete ${schema.name}`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <JsonBlock value={schema.schemaJson} maxHeight="max-h-64" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
