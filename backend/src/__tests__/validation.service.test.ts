import { describe, expect, it } from "vitest";
import { validateLLMResponse } from "../services/validation.service.js";
import type { SchemaShape } from "../types/schema.js";

const schema: SchemaShape = {
  candidateName: { type: "string", required: true },
  skills: { type: "array", items: "string", required: true },
  linkedin: { type: "string", required: false }
};

describe("validateLLMResponse", () => {
  it("returns valid data for matching schema", () => {
    const result = validateLLMResponse({
      schema,
      rawResponse: '{"candidateName":"Kartikey","skills":["Python"]}',
      partialRecovery: false
    });
    expect(result.valid).toBe(true);
  });

  it("uses partial recovery for invalid optional top-level fields", () => {
    const result = validateLLMResponse({
      schema,
      rawResponse: '{"candidateName":"Kartikey","skills":["Python"],"linkedin":123}',
      partialRecovery: true
    });
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.warnings?.length).toBeGreaterThan(0);
  });
});
