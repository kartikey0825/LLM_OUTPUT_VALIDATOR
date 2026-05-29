import { z, type ZodTypeAny } from "zod";
import type { FieldDefinition, SchemaShape } from "../types/schema.js";

function buildField(field: FieldDefinition): ZodTypeAny {
  let validator: ZodTypeAny;

  switch (field.type) {
    case "string":
      validator = z.string();
      if (field.min !== undefined) validator = (validator as z.ZodString).min(field.min);
      if (field.max !== undefined) validator = (validator as z.ZodString).max(field.max);
      break;
    case "number":
      validator = z.number();
      if (field.min !== undefined) validator = (validator as z.ZodNumber).min(field.min);
      if (field.max !== undefined) validator = (validator as z.ZodNumber).max(field.max);
      break;
    case "boolean":
      validator = z.boolean();
      break;
    case "enum":
      if (!field.values || field.values.length === 0) throw new Error("Enum field must include values.");
      validator = z.enum(field.values as [string, ...string[]]);
      break;
    case "array": {
      const itemDef = typeof field.items === "string" ? { type: field.items as FieldDefinition["type"] } : field.items;
      validator = z.array(buildField(itemDef ?? { type: "string" }));
      break;
    }
    case "object": {
      validator = buildZodSchema(field.fields ?? {});
      break;
    }
    default:
      throw new Error(`Unsupported field type: ${(field as FieldDefinition).type}`);
  }

  return field.required === false ? validator.optional().nullable() : validator;
}

export function buildZodSchema(schema: SchemaShape) {
  const shape: Record<string, ZodTypeAny> = {};
  for (const [key, field] of Object.entries(schema)) shape[key] = buildField(field);
  return z.object(shape).strict();
}

export function calculateSchemaDifficulty(schema: SchemaShape): number {
  const scoreField = (field: FieldDefinition): number => {
    let score = field.required === false ? 0 : 1;
    if (field.type === "enum") score += 2;
    if (field.type === "array") score += 1 + (typeof field.items === "object" ? scoreField(field.items) : 0);
    if (field.type === "object") score += 2 + Object.values(field.fields ?? {}).reduce((sum, f) => sum + scoreField(f), 0);
    if (field.min !== undefined || field.max !== undefined) score += 1;
    return score;
  };
  return Math.min(10, Math.max(1, Object.values(schema).reduce((sum, field) => sum + scoreField(field), 0)));
}
