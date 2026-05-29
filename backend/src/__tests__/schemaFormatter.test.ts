import { describe, expect, it } from "vitest";
import { makeExampleOutput, schemaToPromptShape } from "../utils/schemaFormatter.js";
import type { SchemaShape } from "../types/schema.js";

const schema: SchemaShape = {
  sentiment: { type: "enum", values: ["positive", "neutral", "negative"], required: true },
  rating: { type: "number", min: 1, max: 5, required: true },
  keyIssues: { type: "array", items: "string", required: false },
  meta: {
    type: "object",
    required: false,
    fields: {
      source: { type: "string", required: true }
    }
  }
};

describe("schemaFormatter", () => {
  it("formats schemas for prompt injection", () => {
    const promptShape = schemaToPromptShape(schema);
    expect(promptShape).toContain("enum(positive | neutral | negative)");
    expect(promptShape).toContain("items");
    expect(promptShape).toContain("string");
    expect(promptShape).toContain("min 1");
  });

  it("creates a valid-looking few-shot example", () => {
    const example = makeExampleOutput(schema);
    expect(example.sentiment).toBe("positive");
    expect(example.rating).toBe(1);
    expect(example.keyIssues).toEqual(["example string", "another string"]);
    expect(example.meta).toEqual({ source: "example text" });
  });
});
