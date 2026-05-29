import { prisma } from "../db/prisma.js";
import { callLLM } from "./llm.service.js";
import { getSchemaOrThrow } from "./schema.service.js";
import { validateLLMResponse } from "./validation.service.js";
import { buildInjectedPrompt } from "../prompts/injectionPrompts.js";
import { buildCorrectionPrompt } from "../prompts/correctionPrompt.js";
import { schemaToPromptShape } from "../utils/schemaFormatter.js";
import { measure } from "../utils/timer.js";
import { findUnresolvedVariables, renderPromptTemplate } from "../utils/promptRenderer.js";
import { fromJsonString, toJsonString } from "../utils/storageJson.js";
import type { InjectionStrategy } from "../types/schema.js";

type RunCallInput = {
  schemaName: string;
  prompt: string;
  variables?: Record<string, unknown>;
  model?: string;
  strategy?: InjectionStrategy;
  maxAttempts?: number;
  safeMode?: boolean;
  partialRecovery?: boolean;
};

type AttemptDraft = {
  attemptNumber: number;
  rawResponse: string;
  parsedJson?: unknown;
  validationError?: string;
  valid: boolean;
  latencyMs: number;
};

function hydrateAttempt<T extends { parsedJson: string | null }>(attempt: T) {
  return {
    ...attempt,
    parsedJson: fromJsonString(attempt.parsedJson, undefined)
  };
}

function hydrateCall<T extends {
  variables: string | null;
  tokenUsage: string | null;
  validatedOutput: string | null;
  warnings: string | null;
  attempts?: Array<{ parsedJson: string | null }>;
}>(call: T) {
  return {
    ...call,
    variables: fromJsonString(call.variables, undefined),
    tokenUsage: fromJsonString(call.tokenUsage, undefined),
    validatedOutput: fromJsonString(call.validatedOutput, undefined),
    warnings: fromJsonString(call.warnings, []),
    attempts: call.attempts?.map(hydrateAttempt)
  };
}

export async function runValidatedCall(input: RunCallInput) {
  const schemaRecord = await getSchemaOrThrow(input.schemaName);
  const schema = schemaRecord.schemaJson;
  const strategy = input.strategy ?? "json_instruction";
  const maxAttempts = Math.min(Math.max(input.maxAttempts ?? 3, 1), 3);
  const model = input.model ?? "";
  const safeMode = input.safeMode ?? false;
  const partialRecovery = input.partialRecovery ?? false;
  const variables = input.variables ?? {};
  const renderedPrompt = renderPromptTemplate(input.prompt, variables);
  const unresolvedVariables = findUnresolvedVariables(renderedPrompt);

  const attempts: AttemptDraft[] = [];

  const schemaPromptShape = schemaToPromptShape(schema);
  let promptToSend = buildInjectedPrompt({ strategy, schema, userPrompt: renderedPrompt, safeMode });
  let finalOutput: unknown = null;
  let warnings: string[] = unresolvedVariables.length
    ? [`Unresolved prompt variable(s): ${unresolvedVariables.join(", ")}.`]
    : [];
  let tokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  const totalStart = performance.now();

  for (let attemptNumber = 1; attemptNumber <= maxAttempts; attemptNumber++) {
    const { value, latencyMs } = await measure(() => callLLM({ prompt: promptToSend, model, attempt: attemptNumber, strategy, schema, schemaName: input.schemaName }));
    if (value.tokenUsage) {
      tokenUsage.promptTokens += value.tokenUsage.promptTokens ?? 0;
      tokenUsage.completionTokens += value.tokenUsage.completionTokens ?? 0;
      tokenUsage.totalTokens += value.tokenUsage.totalTokens ?? 0;
    }

    const validation = validateLLMResponse({ schema, rawResponse: value.text, partialRecovery: partialRecovery && !safeMode });

    attempts.push({
      attemptNumber,
      rawResponse: value.text,
      parsedJson: validation.valid ? validation.data : validation.parsedJson,
      validationError: validation.valid ? undefined : validation.error,
      valid: validation.valid,
      latencyMs
    });

    if (validation.valid) {
      finalOutput = validation.data;
      warnings = [...warnings, ...(validation.warnings ?? [])];
      break;
    }

    await prisma.failureLog.create({
      data: {
        schemaName: input.schemaName,
        prompt: renderedPrompt,
        model,
        strategy,
        rawResponse: value.text,
        validationError: validation.error,
        attemptNumber
      }
    });

    if (attemptNumber < maxAttempts) {
      promptToSend = buildCorrectionPrompt({
        schema,
        previousResponse: value.text,
        validationError: validation.error,
        safeMode,
        schemaPromptShape
      });
    }
  }

  const success = finalOutput !== null;
  const totalLatencyMs = Math.round(performance.now() - totalStart);

  const call = await prisma.lLMCall.create({
    data: {
      schemaName: input.schemaName,
      prompt: renderedPrompt,
      variables: toJsonString(variables),
      model,
      strategy,
      success,
      safeMode,
      partialRecovery,
      correctionNeeded: attempts.length > 1,
      attemptCount: attempts.length,
      totalLatencyMs,
      tokenUsage: toJsonString(tokenUsage),
      validatedOutput: success ? toJsonString(finalOutput) : undefined,
      warnings: toJsonString(warnings),
      attempts: {
        create: attempts.map((attempt) => ({
          attemptNumber: attempt.attemptNumber,
          rawResponse: attempt.rawResponse,
          parsedJson: toJsonString(attempt.parsedJson),
          validationError: attempt.validationError,
          valid: attempt.valid,
          latencyMs: attempt.latencyMs
        }))
      }
    },
    include: { attempts: true }
  });

  const hydratedCall = hydrateCall(call);
  const hydratedAttempts = hydratedCall.attempts ?? [];

  if (success) {
    return {
      success: true,
      callId: call.id,
      validatedOutput: finalOutput,
      warnings,
      attemptCount: attempts.length,
      correctionNeeded: attempts.length > 1,
      totalLatencyMs,
      tokenUsage,
      strategy,
      schemaDifficulty: schemaRecord.difficulty,
      attempts: hydratedAttempts
    };
  }

  return {
    success: false,
    callId: call.id,
    message: `Validation failed after ${attempts.length} attempt(s).`,
    schemaName: input.schemaName,
    attemptCount: attempts.length,
    totalLatencyMs,
    tokenUsage,
    attempts: hydratedAttempts
  };
}

export async function listCalls() {
  const calls = await prisma.lLMCall.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { attempts: true } });
  return calls.map(hydrateCall);
}

export async function getCall(id: string) {
  const call = await prisma.lLMCall.findUnique({ where: { id }, include: { attempts: true } });
  return call ? hydrateCall(call) : null;
}
