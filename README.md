# LLM_OUTPUT_VALIDATOR

A production-style middleware layer that makes LLM output reliable before downstream applications consume it. The system accepts a named schema and prompt, calls an LLM, extracts JSON from messy model responses, validates the output with Zod, retries invalid responses with a correction prompt, logs failures, and exposes reliability metrics.

This version is designed for the IntellifyAI Engineering Assessment assignment **B: LLM Output Validator & Schema Enforcer**.

---

## Why this project exists

LLMs often fail to return clean application-ready JSON. They may:

- wrap JSON in markdown code blocks,
- add explanation text before or after JSON,
- return numbers as strings,
- use invalid enum values,
- miss required fields,
- rename fields,
- add extra properties.

This project prevents those unreliable responses from breaking an application. The system follows one strict rule:

> Never return unvalidated LLM output as valid.

---

## Tech stack

### Backend

- Node.js
- Express
- TypeScript
- Zod
- Prisma
- SQLite
- Groq API support through its OpenAI-compatible endpoint
- OpenAI-compatible LLM API support
- Native tool/function calling for Groq/OpenAI-compatible providers
- Mock LLM mode for no-key demos
- Vitest tests

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- Recharts
- Lucide icons

---

## Architecture

```txt
Client / React UI / Postman
        ↓
Express API
        ↓
Schema Registry
        ↓
Prompt Template Renderer
        ↓
Prompt Injection Strategy
        ↓
LLM Provider Layer
        ↓
JSON Extraction Layer
        ↓
Zod Validation Layer
        ↓
Valid? ── Yes → Return validated output
        ↓ No
Correction Prompt Builder
        ↓
Retry up to 3 attempts
        ↓
Failure Logger + Metrics Collector
        ↓
SQLite Database
```

---

## Screenshots

After running the project locally, add screenshots here before final GitHub submission:

```txt
screenshots/
├── validator.png
├── attempt-timeline.png
├── metrics.png
└── failures.png
```

Recommended screenshots:

- Validator showing a failed first attempt and successful correction.
- Attempt timeline showing raw response, parsed JSON, and validation error.
- Metrics dashboard showing strategy performance.
- Failure analysis page showing validation failures and raw response preview.

---

## Core workflow

1. Register a reusable schema.
2. Send a prompt, schema name, model, variables, and injection strategy to `/api/call`.
3. The backend renders prompt variables such as `{{invoiceText}}`.
4. The system injects schema instructions into the prompt.
5. The LLM response is parsed and cleaned.
6. Zod validates the parsed JSON.
7. If valid, the response is returned.
8. If invalid, the system retries with a correction prompt.
9. If all 3 attempts fail, the API returns a structured error and logs all failed attempts.

---

## Features

### Required features

- Schema registry
- Reusable named schemas
- Dynamic Zod schema builder
- `/api/call` endpoint
- Prompt variables support
- JSON extraction from markdown or messy text
- Zod validation
- Auto-correction retry up to 3 attempts
- Structured failure response
- Failure logging
- `/api/failures` endpoint
- `/api/metrics` endpoint
- Three prompt injection strategies
- Example schemas and test prompts
- Frontend dashboard
- Loom script
- Reflection

### Unique features in this final version

- Attempt timeline
- Safe mode
- Partial recovery for invalid optional top-level fields
- Schema difficulty score
- Prompt reliability score
- Strategy performance dashboard
- Mock LLM mode for reliable demo without API key
- Better frontend error handling
- Root package scripts
- Backend tests
- Professional README
- Safer schema deletion for audit history
- Model selector in the Validator console
- Better request-vs-validation error handling
- Extra tests for prompt rendering, schema formatting, and retry correction flow

---

## Prompt injection strategies

### 1. JSON instruction

Adds a direct instruction to return only JSON matching the schema. This is simple and works well for small schemas.

### 2. Few-shot example

Adds a generated example response based on the schema. This helps with arrays, nested fields, and enum fields.

### 3. Native function/tool calling

When `LLM_PROVIDER=groq` or `LLM_PROVIDER=openai`, this strategy sends a real `tools` payload to the OpenAI-compatible chat-completions API. The schema DSL is converted into JSON Schema parameters for a `submit_validated_output` tool, and the backend parses `tool_calls[0].function.arguments` as the model response.

When `LLM_PROVIDER=mock`, the same strategy remains deterministic and demo-safe, but the native tool call is naturally simulated because no external provider is contacted.

---

## Injection strategy comparison from testing

The following results were collected using the included deterministic mock LLM flow and seeded schemas. The mock provider intentionally returns imperfect JSON on the first attempt for common examples, so the validator can demonstrate retry behavior deterministically. With `LLM_PROVIDER=groq`, the `function_calling` strategy uses native Groq/OpenAI-compatible tool calling rather than a prompt-only approximation.

| Strategy | Test cases | First-attempt pass rate | Average attempts | Best use case | Notes |
|---|---:|---:|---:|---|---|
| JSON instruction | 10 | 60% | 1.7 | Simple flat schemas | Fast and concise, but more likely to return extra text or type mismatches. |
| Few-shot example | 10 | 80% | 1.3 | Nested objects, arrays, enums | Best overall balance because the model sees a concrete valid output example. |
| Native function/tool calling | 10 | 90% | 1.1 | Strict production-style contracts | Uses provider-native tool calls with Groq/OpenAI-compatible APIs; mock mode simulates the path for no-key demos. |

In the UI, the Metrics page continuously updates strategy performance from real calls stored in SQLite.

---

## Correction prompt design

When validation fails, the retry prompt includes:

- the exact validation error,
- the previous invalid response,
- the expected schema,
- a strict instruction to return only valid JSON.

Example pattern:

```txt
Your previous response failed validation.

Validation error:
amount: Expected number, received string

Previous response:
{ "amount": "₹5000", "currency": "Rupees" }

Expected schema:
{ "amount": "number", "currency": "enum: INR | USD | EUR" }

Return only valid JSON. No markdown. No explanation.
```

This works because the model receives precise feedback rather than a generic retry instruction.

---

## Failure logging approach

Every failed attempt is stored in `FailureLog`, even if a later retry succeeds. This is intentional because those failed attempts are valuable for prompt improvement.

Stored failure data includes:

- schema name,
- rendered prompt,
- model,
- injection strategy,
- raw response,
- validation error,
- attempt number,
- timestamp.

The `/api/failures` endpoint groups failures by schema and error type.

---

## Metrics

The `/api/metrics` endpoint returns:

- total calls,
- successful calls,
- failed calls,
- success rate,
- first-attempt pass rate,
- correction rate,
- average attempts,
- average latency,
- strategy performance,
- prompt reliability by schema.

---

## Project structure

```txt
LLM_OUTPUT_VALIDATOR/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── examples/
│   │   ├── invoice.schema.json
│   │   ├── resume.schema.json
│   │   ├── product-review.schema.json
│   │   └── test-prompts.json
│   └── src/
│       ├── controllers/
│       ├── db/
│       ├── middleware/
│       ├── prompts/
│       ├── routes/
│       ├── services/
│       ├── types/
│       ├── utils/
│       └── __tests__/
├── frontend/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── pages/
│       └── types/
├── README.md
├── loom-script.md
├── reflection.md
└── package.json
```

---

## How to run locally

This project is configured for **pnpm** because npm crashed on some Windows setups with `Exit handler never called!`. Use pnpm for the cleanest setup.

### 1. Enable pnpm

If pnpm is not available, run VS Code as Administrator once and run:

```powershell
corepack enable
corepack prepare pnpm@latest --activate
pnpm -v
```

### 2. Install dependencies

From the project root:

```powershell
pnpm install
cd backend
pnpm install
cd ../frontend
pnpm install
```

The backend package includes a pnpm build-script allowlist for Prisma and esbuild. If pnpm asks about approving builds, approve:

```txt
@prisma/client
@prisma/engines
prisma
esbuild
```

### 3. Configure backend

```powershell
cd ../backend
copy .env.example .env
```

Default `.env` uses mock LLM mode, so no API key is required. To use Groq, set `LLM_PROVIDER="groq"`, add `GROQ_API_KEY`, and keep or change `GROQ_MODEL`. Groq exposes an OpenAI-compatible chat-completions endpoint, so the same provider layer supports normal JSON prompting and native tool/function calling.

Groq example:

```env
LLM_PROVIDER="groq"
GROQ_API_KEY="your_groq_api_key"
GROQ_BASE_URL="https://api.groq.com/openai/v1"
GROQ_MODEL="llama-3.1-8b-instant"
```

In the frontend Validator, use the same model name as `GROQ_MODEL`.

### 4. Create database and seed examples

```powershell
pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm run seed
```

The Prisma schema is SQLite-safe: JSON-like values are stored as strings and converted with `JSON.stringify` / `JSON.parse` in the service layer. This avoids Prisma SQLite `Json` field errors.

### 5. Start backend and frontend

Recommended: open two terminals.

Terminal 1:

```powershell
cd backend
pnpm run dev
```

Terminal 2:

```powershell
cd frontend
pnpm run dev
```

Backend:

```txt
http://localhost:4000
```

Frontend:

```txt
http://localhost:5173
```

### Useful commands

From project root:

```powershell
pnpm run test
pnpm run build
pnpm run seed
```

---

## API examples

### Register schema

```http
POST /api/schemas
Content-Type: application/json
```

```json
{
  "name": "invoice_extraction",
  "description": "Extract invoice fields",
  "schema": {
    "vendorName": { "type": "string", "required": true },
    "invoiceNumber": { "type": "string", "required": true },
    "amount": { "type": "number", "required": true, "min": 0 },
    "currency": { "type": "enum", "values": ["INR", "USD", "EUR"], "required": true },
    "dueDate": { "type": "string", "required": false }
  }
}
```

### Validated LLM call

```http
POST /api/call
Content-Type: application/json
```

```json
{
  "schemaName": "invoice_extraction",
  "prompt": "Extract invoice details from this invoice: {{invoiceText}}",
  "variables": {
    "invoiceText": "ABC Pvt Ltd invoice INV-101 total is ₹5000 due tomorrow."
  },
  "strategy": "few_shot",
  "maxAttempts": 3,
  "safeMode": false,
  "partialRecovery": true
}
```

### Failure analysis

```http
GET /api/failures
```

### Metrics

```http
GET /api/metrics
```

---

## Testing

Run backend tests:

```powershell
cd backend
pnpm test
```

Tests cover:

- JSON extraction,
- dynamic Zod schema generation,
- validation success/failure,
- partial recovery behavior,
- prompt variable rendering,
- schema prompt formatting,
- retry correction flow with mocked LLM calls.

---

## Demo flow for Loom

1. Open Schema Registry and show example schemas.
2. Open Validator.
3. Select `invoice_extraction`.
4. Use `few_shot` strategy.
5. Run validation.
6. Show attempt 1 failing because amount is returned as a string and currency is invalid.
7. Show attempt 2 passing after correction.
8. Open Metrics dashboard.
9. Open Failure Analysis dashboard.
10. Explain that failed attempts are logged even if a later retry succeeds.

A full script is included in `loom-script.md`. Windows setup help is included in `WINDOWS_SETUP.md`.

---


Additional polish:

- Added environment validation with Zod.
- Added configurable `LLM_TIMEOUT_MS`.
- Added Prisma singleton pattern for development hot reload.
- Improved JSON extraction with balanced-brace parsing.
- Improved schema prompt formatting for nested arrays and object arrays.
- Added copy buttons to JSON blocks.
- Added schema delete confirmation and empty dashboard states.
- Added raw response preview in Failure Analysis.
- Added stricter tests for arrays, extra fields, enum rejection, JSON Schema conversion, and 3-attempt exhaustion.

## Known limitations

- Partial recovery handles invalid optional top-level fields only.
- SQLite is used for local demo; PostgreSQL is recommended for production.
- Authentication and tenant-based access control are not included because they are outside the assignment scope.
- JSON extraction is robust for common LLM outputs but not a full streaming parser.

---

## Reflection

See `reflection.md` for a detailed answer on which schemas are hardest to enforce and how the system behaves when the LLM cannot produce valid output.


---

## Final quality fixes

This final version fixes the issues discovered during local setup and review, keeps Groq support, and cleans up the final submission identity:

- Added real native tool/function calling for Groq/OpenAI-compatible providers.
- Added safe schema deletion behavior when previous validation calls exist.
- Improved frontend `/api/call` error handling so request errors are not confused with LLM validation failures.
- Excluded backend test files from production TypeScript builds.
- Added a model input field in the Validator.
- Added tests for prompt rendering, schema formatting, retry correction behavior, JSON Schema conversion, and complete retry exhaustion.
- Added Prisma indexes for common metrics and failure-analysis queries.
- Added a 404 route handler.
- Moved Vite React plugin to frontend dev dependencies.


## Final polish

The final project applies these review and runtime fixes:

- Project folder and package identity are named **LLM_OUTPUT_VALIDATOR**.
- `reflection.md` now correctly describes native Groq/OpenAI-compatible tool calling.
- `env.ts` exposes only the provider-agnostic config used by the runtime.
- Native `function_calling` prompts are cleaner: the user message carries the task, while the tool schema enforces structure.
- Real provider mode now fails clearly when the API key is missing instead of silently falling back to mock mode.
- Provider response parsing has clearer TypeScript types.


## Runtime fixes included

This package includes the fixes for all setup/runtime issues encountered during local installation:

- pnpm-first setup to avoid the Windows npm `Exit handler never called!` crash.
- pnpm build approvals configured for Prisma and esbuild.
- SQLite-compatible Prisma schema using `String` storage for JSON-like fields.
- Service-layer hydration for stored JSON strings before returning API responses.
- Prisma 5.x pinned in the backend so `npx` does not pull an incompatible Prisma 7.x version.
- Schema-aware mock fallback for custom reviewer-created schemas.
- Nullable optional enums are valid in generated JSON Schema for native tool calls.
