import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { getFailures } from "../api/client";
import { JsonBlock } from "../components/JsonBlock";
import { Card } from "../components/ui/Card";

export function Failures() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => { getFailures().then(setData).catch((err) => setError(err.message)); }, []);

  if (error) return <Card><p className="text-rose-700">{error}</p><p className="mt-2 text-sm text-slate-500">Make sure the backend is running on http://localhost:4000.</p></Card>;
  if (!data) return <Card>Loading failures...</Card>;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-rose-50 p-3 text-rose-700"><AlertTriangle /></div>
          <div>
            <h2 className="text-xl font-bold">Failure Analysis</h2>
            <p className="text-sm text-slate-500">Understand what breaks and how prompts can be improved.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Total failures</p><p className="text-3xl font-bold">{data.totalFailures}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Top schema</p><p className="text-xl font-bold">{data.topFailingSchemas?.[0]?.schemaName ?? "None"}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Common error</p><p className="line-clamp-2 text-sm font-semibold">{data.commonErrors?.[0]?.error ?? "None"}</p></div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-xl font-bold">Recent Failure Logs</h2>
        <div className="pretty-scroll max-h-[620px] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-white text-slate-500">
              <tr><th className="p-3">Schema</th><th className="p-3">Attempt</th><th className="p-3">Strategy</th><th className="p-3">Error</th><th className="p-3">Raw response</th></tr>
            </thead>
            <tbody>
              {data.recentFailures.map((row: any) => (
                <tr key={row.id} className="border-t border-slate-100 align-top">
                  <td className="p-3 font-semibold">{row.schemaName}</td>
                  <td className="p-3">{row.attemptNumber}</td>
                  <td className="p-3">{row.strategy}</td>
                  <td className="p-3 text-rose-700">{row.validationError}</td>
                  <td className="p-3">
                    <details className="rounded-xl bg-slate-50 p-2">
                      <summary className="cursor-pointer text-xs font-semibold text-slate-600">Preview</summary>
                      <div className="mt-2"><JsonBlock value={row.rawResponse} maxHeight="max-h-44" /></div>
                    </details>
                  </td>
                </tr>
              ))}
              {data.recentFailures.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-slate-500">No validation failures recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
