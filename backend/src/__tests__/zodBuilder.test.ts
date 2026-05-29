import { describe, expect, it } from "vitest";
import { buildZodSchema, calculateSchemaDifficulty } from "../utils/zodBuilder.js";
import type { SchemaShape } from "../types/schema.js";

const schema: SchemaShape = {
  name: { type: "string", required: true },
  score: { type: "number", required: true, min: 0, max: 100 },
  priority: { type: "enum", values: ["low", "high"], required: true },
  notes: { type: "string", required: false }
};

describe("zodBuilder", () => {
  it("validates correct objects", () => {
    const result = buildZodSchema(schema).safeParse({ name: "Lead", score: 80, priority: "high" });
    expect(result.success).toBe(true);
  });

  it("rejects wrong types", () => {
    const result = buildZodSchema(schema).safeParse({ name: "Lead", score: "80", priority: "high" });
    expect(result.success).toBe(false);
  });

  it("rejects extra fields because schemas are strict", () => {
    const result = buildZodSchema(schema).safeParse({ name: "Lead", score: 90, priority: "high", extra: "not allowed" });
    expect(result.success).toBe(false);
  });

  it("rejects enum values outside the allowed set", () => {
    const result = buildZodSchema(schema).safeParse({ name: "Lead", score: 90, priority: "medium" });
    expect(result.success).toBe(false);
  });

  it("calculates schema difficulty", () => {
    expect(calculateSchemaDifficulty(schema)).toBeGreaterThan(1);
  });
});
