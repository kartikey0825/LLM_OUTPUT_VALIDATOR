import { useState } from "react";
import { Activity, ClipboardCheck, Database, FileWarning, Layers3, ShieldCheck, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Playground } from "./pages/Playground";
import { Schemas } from "./pages/Schemas";
import { Metrics } from "./pages/Metrics";
import { Failures } from "./pages/Failures";

type Tab = "playground" | "schemas" | "metrics" | "failures";

const tabs: Array<{ id: Tab; label: string; icon: LucideIcon }> = [
  { id: "playground", label: "Validator", icon: ClipboardCheck },
  { id: "schemas", label: "Schemas", icon: Database },
  { id: "metrics", label: "Insights", icon: Activity },
  { id: "failures", label: "Failures", icon: FileWarning }
];

const highlights = [
  { label: "Schema contracts", icon: Layers3, tone: "text-indigo-600 bg-indigo-50" },
  { label: "Automatic correction", icon: Wrench, tone: "text-emerald-700 bg-emerald-50" },
  { label: "Audit trail", icon: Activity, tone: "text-slate-700 bg-slate-50" }
];

export default function App() {
  const [active, setActive] = useState<Tab>("playground");

  return (
    <main className="min-h-screen px-4 py-6 text-slate-950 md:px-8 lg:px-10">
      <section className="mx-auto max-w-7xl">
        <header className="relative mb-8 overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur md:p-8">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-1 rounded-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-100/60 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-indigo-100/60 blur-3xl" />

          <div className="relative flex flex-col gap-7">
            <div className="grid gap-6 xl:grid-cols-[1fr_auto] xl:items-start">
              <div className="flex max-w-4xl items-start gap-5">
                <div className="hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 text-white shadow-lg shadow-indigo-900/20 sm:block">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <div>
                  <p className="mb-3 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">
                    Schema-based output control
                  </p>
                  <h1 className="max-w-4xl text-4xl font-black tracking-tight text-slate-950 md:text-5xl lg:text-6xl">
                    Output Validator
                  </h1>
                  <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                    Check every model response against a contract before it reaches the application.
                  </p>
                </div>
              </div>

              <nav className="flex flex-wrap gap-2 rounded-3xl border border-slate-200/80 bg-white/80 p-2 shadow-sm xl:min-w-[470px] xl:justify-end">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const selected = active === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActive(tab.id)}
                      className={`inline-flex min-w-[112px] items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        selected
                          ? "bg-slate-950 text-white shadow-lg shadow-slate-950/15"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="relative grid gap-3 sm:grid-cols-3">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
                    <span className={`rounded-xl p-2 ${item.tone}`}><Icon className="h-4 w-4" /></span>
                    {item.label}
                  </div>
                );
              })}
            </div>
          </div>
        </header>

        {active === "playground" && <Playground />}
        {active === "schemas" && <Schemas />}
        {active === "metrics" && <Metrics />}
        {active === "failures" && <Failures />}
      </section>
    </main>
  );
}
