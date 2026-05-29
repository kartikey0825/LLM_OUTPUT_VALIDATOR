# Loom demo script — LLM_OUTPUT_VALIDATOR

## 0:00–0:25 — Intro
This is my LLM_OUTPUT_VALIDATOR and Schema Enforcer. It prevents unsafe LLM output from reaching an application by validating every response against a registered schema.

## 0:25–0:55 — Schema registry
Show the invoice, resume, and product review schemas. Explain string, number, enum, array, optional fields, and the schema difficulty score.

## 0:55–1:30 — Prompt variables
Open the Validator tab. Show the prompt template using `{{invoiceText}}` and the variables JSON. Explain that the backend renders variables before calling the LLM.

## 1:30–2:20 — Validation and auto-correction
Run the invoice example. In mock mode, attempt 1 intentionally returns `amount` as `₹5000` and `currency` as `Rupees`, which fails Zod validation. Show the attempt timeline and then the corrected successful output.

## 2:20–2:55 — Correction prompt design
Explain that the retry prompt includes the previous response, the exact validation error, and the expected schema. The system retries up to 3 attempts and never returns unvalidated output as valid.

## 2:55–3:30 — Metrics
Show success rate, first-attempt pass rate, average latency, strategy comparison, and prompt reliability.

## 3:30–4:00 — Failures
Show failure logs. Explain that failed attempts are logged even when a later retry succeeds because those logs help improve prompts.


## Groq note

For the final demo, mention that mock mode is used for deterministic recording. For real calls, set `LLM_PROVIDER=groq`, paste `GROQ_API_KEY`, and use the `function_calling` strategy to trigger native OpenAI-compatible tool calling.
