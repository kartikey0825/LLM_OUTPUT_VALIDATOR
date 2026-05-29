# Reflection — LLM_OUTPUT_VALIDATOR

The hardest schemas to enforce reliably are deeply nested objects, strict enum values, arrays of objects, and numeric constraints. LLMs commonly return numeric fields as strings, wrap JSON in markdown, add explanation text, use semantically similar but invalid enum values, or rename fields.

This system handles these issues by extracting JSON, validating the parsed output through Zod, and using a correction prompt that includes the exact validation failure, previous response, and expected schema. The retry loop is limited to three attempts to avoid silent infinite correction loops.

If the LLM still cannot produce valid output after three attempts, the system fails loudly. It returns a structured failure response containing the call ID, attempt count, latency, token usage, raw attempt outputs, and validation errors. It also logs failed attempts for later analysis.

The system never returns unvalidated data as valid. This is the most important safety rule because downstream applications should not trust uncertain LLM output.

In the final version, function-calling uses native tool calling for OpenAI-compatible providers such as Groq and OpenAI. The project converts the custom schema DSL into a JSON Schema parameter object and sends it through the `tools` payload with `tool_choice` forced to `submit_validated_output`. The backend then reads `tool_calls[0].function.arguments` as the candidate structured output. In mock mode, this behavior is simulated deterministically so the project can still be demonstrated without an API key.

Partial recovery currently handles invalid optional top-level fields only; nested recovery can be added in a later version. The correction prompt also assumes the model can understand validation errors. For deeply nested schemas, error paths such as `items.0.address.city` can be opaque, so the system benefits from clear schema names and human-readable field descriptions.

One unrecoverable case is missing source data. For example, if a required invoice number is not present in the source text, safe mode should not invent it. In that case, the system should fail loudly rather than returning ungrounded structured data.
