import axios from "axios";
import { env } from "../config/env.js";
import { AppError } from "../utils/appError.js";
import { schemaShapeToJsonSchema } from "../utils/jsonSchemaBuilder.js";
import { makeExampleOutput } from "../utils/schemaFormatter.js";
import type { InjectionStrategy, SchemaShape } from "../types/schema.js";

type LLMResponse = {
  text: string;
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
};

type ProviderChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
      tool_calls?: Array<{
        function?: { arguments?: string };
      }>;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

function mockResponse(prompt: string, attempt: number, schemaName?: string, schema?: SchemaShape): string {
  const lower = `${schemaName ?? ""} ${prompt}`.toLowerCase();

  if (lower.includes("force_all_attempts_fail") || lower.includes("always fail")) {
    return `I cannot produce that structure. Attempt ${attempt}.`;
  }

  if (attempt === 1 && lower.includes("invoice")) {
    return `Here is the extracted JSON:\n\n\`\`\`json\n{\n  "vendorName": "ABC Pvt Ltd",\n  "invoiceNumber": "INV-101",\n  "amount": "₹5000",\n  "currency": "Rupees",\n  "dueDate": "tomorrow"\n}\n\`\`\``;
  }

  if (lower.includes("invoice")) {
    return JSON.stringify({
      vendorName: "ABC Pvt Ltd",
      invoiceNumber: "INV-101",
      amount: 5000,
      currency: "INR",
      dueDate: "tomorrow"
    });
  }

  if (attempt === 1 && lower.includes("resume")) {
    return JSON.stringify({
      candidateName: "Kartikey Raj",
      email: null,
      skill: ["Python", "SQL", "React", "FastAPI"],
      education: "B.Tech CSE",
      experienceYears: "0"
    });
  }

  if (lower.includes("resume")) {
    return JSON.stringify({
      candidateName: "Kartikey Raj",
      email: null,
      skills: ["Python", "SQL", "React", "FastAPI"],
      education: "B.Tech CSE",
      experienceYears: 0
    });
  }

  if (attempt === 1 && lower.includes("product")) {
    return `{"sentiment":"good","rating":"5","keyIssues":[]}`;
  }

  if (lower.includes("product")) return JSON.stringify({ sentiment: "positive", rating: 5, keyIssues: [] });

  // Schema-aware fallback for custom schemas in mock mode. This keeps reviewer demos useful
  // even when they create a new schema that is not one of the seeded examples.
  if (schema) {
    if (attempt === 1) return `Here is the extracted output, but it may need validation: ${JSON.stringify({})}`;
    return JSON.stringify(makeExampleOutput(schema));
  }

  return JSON.stringify({});
}

function buildNativeTool(schema: SchemaShape) {
  return {
    type: "function",
    function: {
      name: "submit_validated_output",
      description: "Submit the final application-ready JSON object that exactly matches the requested schema.",
      parameters: schemaShapeToJsonSchema(schema)
    }
  };
}

function parseProviderText(data: ProviderChatResponse): string {
  const message = data.choices?.[0]?.message;
  const toolCall = message?.tool_calls?.[0];
  const toolArguments = toolCall?.function?.arguments;
  if (typeof toolArguments === "string" && toolArguments.trim()) return toolArguments;
  return message?.content ?? "";
}

function tokenUsageFrom(data: ProviderChatResponse): LLMResponse["tokenUsage"] {
  const usage = data.usage;
  return usage
    ? { promptTokens: usage.prompt_tokens, completionTokens: usage.completion_tokens, totalTokens: usage.total_tokens }
    : undefined;
}

export async function callLLM(args: {
  prompt: string;
  model?: string;
  attempt: number;
  strategy?: InjectionStrategy;
  schema?: SchemaShape;
  schemaName?: string;
}): Promise<LLMResponse> {
  if (env.llmProvider === "mock") {
    const text = mockResponse(args.prompt, args.attempt, args.schemaName, args.schema);
    return {
      text,
      tokenUsage: {
        promptTokens: Math.ceil(args.prompt.length / 4),
        completionTokens: Math.ceil(text.length / 4),
        totalTokens: Math.ceil((args.prompt.length + text.length) / 4)
      }
    };
  }

  if (!env.providerApiKey) {
    throw new AppError(`${env.llmProvider} API key is missing. Set the provider API key in backend/.env or switch LLM_PROVIDER to mock.`, 500);
  }

  const model = args.model || env.providerModel;
  const useNativeTools = args.strategy === "function_calling" && args.schema;

  const body: Record<string, unknown> = {
    model,
    messages: [
      {
        role: "system",
        content: useNativeTools
          ? "You are a strict structured-output engine. Use the provided tool to submit only the final validated object. Do not answer in normal text."
          : "You are a strict structured-output engine. Return only the requested JSON. Never include markdown or explanations."
      },
      { role: "user", content: args.prompt }
    ],
    temperature: 0.1
  };

  if (useNativeTools) {
    body.tools = [buildNativeTool(args.schema!)];
    body.tool_choice = { type: "function", function: { name: "submit_validated_output" } };
  }

  try {
    const response = await axios.post(`${env.providerBaseUrl}/chat/completions`, body, {
      headers: { Authorization: `Bearer ${env.providerApiKey}`, "Content-Type": "application/json" },
      timeout: env.llmTimeoutMs
    });

    return { text: parseProviderText(response.data as ProviderChatResponse), tokenUsage: tokenUsageFrom(response.data as ProviderChatResponse) };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const providerMessage = typeof error.response?.data === "object" ? JSON.stringify(error.response.data) : error.message;
      throw new AppError(`LLM provider request failed: ${providerMessage}`, 502);
    }
    throw new AppError("LLM provider request failed.", 502);
  }
}
