import type { InjectionStrategy, SchemaShape } from "../types/schema.js";
import { makeExampleOutput, schemaToPromptShape } from "../utils/schemaFormatter.js";

export function buildInjectedPrompt(args: {
  strategy: InjectionStrategy;
  schema: SchemaShape;
  userPrompt: string;
  safeMode: boolean;
}) {
  const schemaShape = schemaToPromptShape(args.schema);
  const safety = args.safeMode
    ? "Safe mode is enabled. Do not infer missing values. Do not coerce invalid data. Use null only for optional fields when missing."
    : "You may normalize obvious formatting issues, such as converting currency text into numeric values when clear.";

  const commonRules = `
You are a strict JSON generation engine.
Return ONLY valid JSON. No markdown. No explanation. No comments.
The JSON must match the expected schema exactly.
Do not add extra fields.
${safety}
`;

  if (args.strategy === "few_shot") {
    return `${commonRules}
Expected schema:
${schemaShape}

Example valid output:
${JSON.stringify(makeExampleOutput(args.schema), null, 2)}

User task:
${args.userPrompt}`;
  }

  if (args.strategy === "function_calling") {
    return `Native tool/function calling strategy is selected.
Use the provided tool schema when the provider supports tools. Do not answer in normal prose.
${args.safeMode ? "Safe mode is enabled. Do not infer missing values. Use null only for optional fields when missing." : "Normalize only obvious formatting issues when the source data is clear."}

User task:
${args.userPrompt}`;
  }

  return `${commonRules}
Respond only with valid JSON matching this schema:
${schemaShape}

User task:
${args.userPrompt}`;
}
