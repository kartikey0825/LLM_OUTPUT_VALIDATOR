import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  LLM_PROVIDER: z.enum(["mock", "openai", "groq"]).default("mock"),
  OPENAI_API_KEY: z.string().default(""),
  OPENAI_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  GROQ_API_KEY: z.string().default(""),
  GROQ_BASE_URL: z.string().url().default("https://api.groq.com/openai/v1"),
  GROQ_MODEL: z.string().default("llama-3.1-8b-instant"),
  CORS_ORIGIN: z.string().default("*"),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(30000)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const provider = parsed.data.LLM_PROVIDER;

export const env = {
  port: parsed.data.PORT,
  llmProvider: provider,
  providerApiKey: provider === "groq" ? parsed.data.GROQ_API_KEY : parsed.data.OPENAI_API_KEY,
  providerBaseUrl: provider === "groq" ? parsed.data.GROQ_BASE_URL : parsed.data.OPENAI_BASE_URL,
  providerModel: provider === "groq" ? parsed.data.GROQ_MODEL : parsed.data.OPENAI_MODEL,
  corsOrigin: parsed.data.CORS_ORIGIN,
  llmTimeoutMs: parsed.data.LLM_TIMEOUT_MS
};
