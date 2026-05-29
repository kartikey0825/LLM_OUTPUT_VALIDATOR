import type { SchemaShape, ValidationResult } from "../types/schema.js";
import { extractJson } from "../utils/jsonExtractor.js";
import { buildZodSchema } from "../utils/zodBuilder.js";

export function validateLLMResponse(args: {
  schema: SchemaShape;
  rawResponse: string;
  partialRecovery: boolean;
}): ValidationResult {
  let parsed: unknown;
  try {
    parsed = extractJson(args.rawResponse);
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : "Invalid JSON" };
  }

  const validator = buildZodSchema(args.schema);
  const result = validator.safeParse(parsed);

  if (result.success) return { valid: true, data: result.data };

  if (args.partialRecovery && typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
    const cleaned = { ...(parsed as Record<string, unknown>) };
    const warnings: string[] = [];

    for (const issue of result.error.issues) {
      const field = String(issue.path[0] ?? "");
      const fieldDef = args.schema[field];
      if (field && fieldDef?.required === false) {
        delete cleaned[field];
        warnings.push(`Optional field '${field}' was removed because it failed validation: ${issue.message}`);
      }
    }

    const retry = validator.safeParse(cleaned);
    if (retry.success) return { valid: true, data: retry.data, warnings };
  }

  return {
    valid: false,
    parsedJson: parsed,
    error: result.error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`).join("; ")
  };
}
