import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getMetrics } from "../api/client";
import { Card, StatCard } from "../components/ui/Card";
import type { Metrics as MetricsType } from "../types";

export function Metrics() {
  const [metrics, setMetrics] = useState<MetricsType | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMetrics().then(setMetrics).catch((err) => setError(err.message));
  }, []);

  if (error) return <Card><p className="text-rose-700">{error}</p><p className="mt-2 text-sm text-slate-500">Make sure the backend is running on http://localhost:4000.</p></Card>;
  if (!metrics) return <Card>Loading metrics...</Card>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total calls" value={metrics.totalCalls} />
        <StatCard title="Success rate" value={`${metrics.successRate}%`} />
        <StatCard title="First-attempt pass" value={`${metrics.firstAttemptPassRate}%`} />
        <StatCard title="Avg latency" value={`${metrics.averageLatencyMs}ms`} />
      </div>

      <Card>
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700"><BarChart3 /></div>
          <div>
            <h2 className="text-xl font-bold">Strategy Performance</h2>
            <p className="text-sm text-slate-500">Compare prompt injection strategies by first-attempt pass rate.</p>
          </div>
        </div>
        {metrics.strategyPerformance.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Run a validation call from the Validator to generate strategy metrics.
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.strategyPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="strategy" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="firstAttemptPassRate" name="First attempt pass rate" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 text-xl font-bold">Prompt Reliability</h2>
        <div className="overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr><th className="p-3">Schema</th><th className="p-3">Difficulty</th><th className="p-3">Calls</th><th className="p-3">Reliability</th><th className="p-3">First-pass</th></tr>
            </thead>
            <tbody>
              {metrics.promptReliability.length === 0 && (
                <tr><td className="p-6 text-center text-slate-500" colSpan={5}>No prompt reliability data yet.</td></tr>
              )}
              {metrics.promptReliability.map((row) => (
                <tr className="border-t border-slate-100" key={row.schemaName}>
                  <td className="p-3 font-semibold">{row.schemaName}</td>
                  <td className="p-3">{row.difficulty}/10</td>
                  <td className="p-3">{row.totalCalls}</td>
                  <td className="p-3">{row.reliabilityScore}%</td>
                  <td className="p-3">{row.firstAttemptPassRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
