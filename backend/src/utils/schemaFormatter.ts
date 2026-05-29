import type { FieldDefinition, SchemaShape } from "../types/schema.js";

function decorateRequired(value: unknown, field: FieldDefinition): unknown {
  if (field.required === false) {
    if (typeof value === "string") return `optional ${value}`;
    return { optional: true, shape: value };
  }
  return value;
}

function formatArrayItems(items: FieldDefinition | string | undefined): unknown {
  if (!items) return "unknown";
  if (typeof items === "string") return items;
  return formatField(items);
}

function formatField(field: FieldDefinition): unknown {
  let value: unknown;

  switch (field.type) {
    case "enum":
      value = `enum(${field.values?.join(" | ") ?? ""})`;
      break;
    case "array":
      value = { type: "array", note: "zero or more items", items: formatArrayItems(field.items) };
      break;
    case "object": {
      const nested = field.fields ?? {};
      value = Object.fromEntries(Object.entries(nested).map(([key, nestedField]) => [key, formatField(nestedField)]));
      break;
    }
    case "number": {
      const constraints = [field.min !== undefined ? `min ${field.min}` : null, field.max !== undefined ? `max ${field.max}` : null]
        .filter(Boolean)
        .join(", ");
      value = constraints ? `number (${constraints})` : "number";
      break;
    }
    default:
      value = field.type;
  }

  return decorateRequired(value, field);
}

export function schemaToPromptShape(schema: SchemaShape): string {
  const formatted = Object.fromEntries(Object.entries(schema).map(([key, value]) => [key, formatField(value)]));
  return JSON.stringify(formatted, null, 2);
}

export function makeExampleOutput(schema: SchemaShape): Record<string, unknown> {
  const make = (field: FieldDefinition): unknown => {
    switch (field.type) {
      case "string": return "example text";
      case "number": return field.min ?? 1;
      case "boolean": return true;
      case "enum": return field.values?.[0] ?? "example";
      case "array": {
        if (typeof field.items === "string") return [`example ${field.items}`, `another ${field.items}`];
        return [make(field.items ?? { type: "string" }), make(field.items ?? { type: "string" })];
      }
      case "object": return Object.fromEntries(Object.entries(field.fields ?? {}).map(([k, v]) => [k, make(v)]));
      default: return null;
    }
  };

  return Object.fromEntries(Object.entries(schema).map(([key, value]) => [key, make(value)]));
}
