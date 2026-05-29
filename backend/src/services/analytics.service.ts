import { createHash } from "node:crypto";
import type { FailureLog, Prisma, SchemaDefinition } from "@prisma/client";
import { prisma } from "../db/prisma.js";

type CallWithAttempts = Prisma.LLMCallGetPayload<{ include: { attempts: true } }>;

function pct(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
}

function promptHash(prompt: string) {
  return createHash("sha256").update(prompt).digest("hex").slice(0, 12);
}

export async function getFailures() {
  const failures: FailureLog[] = await prisma.failureLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  const bySchema = new Map<string, number>();
  const byError = new Map<string, number>();
  const byPrompt = new Map<string, { prompt: string; promptHash: string; count: number }>();

  for (const failure of failures) {
    bySchema.set(failure.schemaName, (bySchema.get(failure.schemaName) ?? 0) + 1);
    byError.set(failure.validationError, (byError.get(failure.validationError) ?? 0) + 1);

    const key = `${failure.schemaName}:${promptHash(failure.prompt)}`;
    const existing = byPrompt.get(key);
    if (existing) existing.count += 1;
    else byPrompt.set(key, { prompt: failure.prompt.slice(0, 100), promptHash: key, count: 1 });
  }

  return {
    totalFailures: failures.length,
    topFailingSchemas: [...bySchema.entries()].map(([schemaName, failureCount]) => ({ schemaName, failureCount })).sort((a, b) => b.failureCount - a.failureCount),
    commonErrors: [...byError.entries()].map(([error, count]) => ({ error, count })).sort((a, b) => b.count - a.count).slice(0, 10),
    failingPromptPatterns: [...byPrompt.values()].sort((a, b) => b.count - a.count).slice(0, 10),
    recentFailures: failures
  };
}

export async function getMetrics() {
  const calls: CallWithAttempts[] = await prisma.lLMCall.findMany({ include: { attempts: true } });
  const totalCalls = calls.length;
  const successfulCalls = calls.filter((call) => call.success).length;
  const failedCalls = totalCalls - successfulCalls;
  const firstAttemptSuccess = calls.filter((call) => call.success && call.attemptCount === 1).length;
  const correctionNeeded = calls.filter((call) => call.correctionNeeded).length;
  const avgAttempts = totalCalls ? calls.reduce((sum, call) => sum + call.attemptCount, 0) / totalCalls : 0;
  const avgLatency = totalCalls ? calls.reduce((sum, call) => sum + call.totalLatencyMs, 0) / totalCalls : 0;

  const strategies = Array.from(new Set(calls.map((call) => call.strategy)));
  const strategyPerformance = strategies.map((strategy) => {
    const rows = calls.filter((call) => call.strategy === strategy);
    return {
      strategy,
      totalCalls: rows.length,
      successRate: pct(rows.filter((row) => row.success).length, rows.length),
      firstAttemptPassRate: pct(rows.filter((row) => row.success && row.attemptCount === 1).length, rows.length),
      averageAttempts: rows.length ? Number((rows.reduce((sum, row) => sum + row.attemptCount, 0) / rows.length).toFixed(2)) : 0
    };
  });

  const schemas: SchemaDefinition[] = await prisma.schemaDefinition.findMany();
  const promptReliability = schemas.map((schema) => {
    const rows = calls.filter((call) => call.schemaName === schema.name);
    return {
      schemaName: schema.name,
      difficulty: schema.difficulty,
      totalCalls: rows.length,
      reliabilityScore: pct(rows.filter((row) => row.success).length, rows.length),
      firstAttemptPassRate: pct(rows.filter((row) => row.success && row.attemptCount === 1).length, rows.length)
    };
  });

  return {
    totalCalls,
    successfulCalls,
    failedCalls,
    successRate: pct(successfulCalls, totalCalls),
    firstAttemptPassRate: pct(firstAttemptSuccess, totalCalls),
    correctionRate: pct(correctionNeeded, totalCalls),
    averageAttempts: Number(avgAttempts.toFixed(2)),
    averageLatencyMs: Math.round(avgLatency),
    strategyPerformance,
    promptReliability
  };
}
