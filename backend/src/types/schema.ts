export type FieldType = "string" | "number" | "boolean" | "enum" | "array" | "object";

export type FieldDefinition = {
  type: FieldType;
  required?: boolean;
  description?: string;
  min?: number;
  max?: number;
  values?: string[];
  items?: FieldDefinition | "string" | "number" | "boolean" | "object";
  fields?: Record<string, FieldDefinition>;
};

export type SchemaShape = Record<string, FieldDefinition>;

export type InjectionStrategy = "json_instruction" | "few_shot" | "function_calling";

export type ValidationSuccess = {
  valid: true;
  data: unknown;
  warnings?: string[];
};

export type ValidationFailure = {
  valid: false;
  error: string;
  parsedJson?: unknown;
};

export type ValidationResult = ValidationSuccess | ValidationFailure;
