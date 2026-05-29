import { describe, expect, it } from "vitest";
import { schemaShapeToJsonSchema } from "../utils/jsonSchemaBuilder.js";

const schema = {
  vendorName: { type: "string", required: true },
  amount: { type: "number", min: 1, required: true },
  currency: { type: "enum", values: ["INR", "USD"], required: true },
  notes: { type: "string", required: false },
  paymentMethod: { type: "enum", values: ["upi", "card"], required: false }
} as const;

describe("schemaShapeToJsonSchema", () => {
  it("converts the project schema DSL into provider tool parameters", () => {
    const jsonSchema = schemaShapeToJsonSchema(schema as any);

    expect(jsonSchema).toMatchObject({
      type: "object",
      additionalProperties: false,
      required: ["vendorName", "amount", "currency"]
    });
    expect((jsonSchema.properties as any).amount.minimum).toBe(1);
    expect((jsonSchema.properties as any).currency.enum).toEqual(["INR", "USD"]);
    expect((jsonSchema.properties as any).notes.type).toEqual(["string", "null"]);
    expect((jsonSchema.properties as any).paymentMethod.type).toEqual(["string", "null"]);
    expect((jsonSchema.properties as any).paymentMethod.enum).toEqual(["upi", "card", null]);
  });
});
