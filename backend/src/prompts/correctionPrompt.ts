import { schemaToPromptShape } from "../utils/schemaFormatter.js";
import type { SchemaShape } from "../types/schema.js";

export function buildCorrectionPrompt(args: {
  schema: SchemaShape;
  previousResponse: string;
  validationError: string;
  safeMode?: boolean;
  schemaPromptShape?: string;
}) {
  const shape = args.schemaPromptShape ?? schemaToPromptShape(args.schema);
  return `Your previous response failed validation.

Validation error:
${args.validationError}

Previous response:
${args.previousResponse}

Expected schema shape:
${shape}

Rules:
- Return only valid JSON.
- Do not include markdown fences.
- Do not include explanation text.
- Do not add fields that are not in the schema.
- Preserve numeric fields as numbers, not strings with currency symbols.
${args.safeMode ? "- Safe mode is enabled: do not infer missing required values. If the source does not contain a required value, return the closest explicit value only if it is present." : "- You may normalize obvious formatting issues, such as converting '₹5000' to 5000 when the value is explicit."}
`;
}
