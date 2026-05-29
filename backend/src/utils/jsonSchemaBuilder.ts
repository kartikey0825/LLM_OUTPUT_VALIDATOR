import type { FieldDefinition, SchemaShape } from "../types/schema.js";

type JsonSchema = Record<string, unknown>;

function nullableIfOptional(schema: JsonSchema, field: FieldDefinition): JsonSchema {
  if (field.required !== false) return schema;

  const type = schema.type;
  const next: JsonSchema = { ...schema };

  if (typeof type === "string") next.type = [type, "null"];

  // JSON Schema requires null to be included in enum values when the type allows null.
  // Otherwise optional enum fields cannot be explicitly returned as null by tool-calling models.
  if (Array.isArray(next.enum) && !next.enum.includes(null)) {
    next.enum = [...next.enum, null];
  }

  return next;
}

function fieldToJsonSchema(field: FieldDefinition): JsonSchema {
  let schema: JsonSchema;

  switch (field.type) {
    case "string":
      schema = { type: "string" };
      if (field.min !== undefined) schema.minLength = field.min;
      if (field.max !== undefined) schema.maxLength = field.max;
      break;
    case "number":
      schema = { type: "number" };
      if (field.min !== undefined) schema.minimum = field.min;
      if (field.max !== undefined) schema.maximum = field.max;
      break;
    case "boolean":
      schema = { type: "boolean" };
      break;
    case "enum":
      schema = { type: "string", enum: field.values ?? [] };
      break;
    case "array": {
      const itemSchema = typeof field.items === "string"
        ? fieldToJsonSchema({ type: field.items })
        : fieldToJsonSchema(field.items ?? { type: "string" });
      schema = { type: "array", items: itemSchema };
      break;
    }
    case "object":
      schema = schemaShapeToJsonSchema(field.fields ?? {});
      break;
    default:
      schema = { type: "string" };
  }

  if (field.description) schema.description = field.description;
  return nullableIfOptional(schema, field);
}

export function schemaShapeToJsonSchema(shape: SchemaShape): JsonSchema {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, field] of Object.entries(shape)) {
    properties[key] = fieldToJsonSchema(field);
    if (field.required !== false) required.push(key);
  }

  return {
    type: "object",
    properties,
    required,
    additionalProperties: false
  };
}
