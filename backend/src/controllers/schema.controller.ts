import type { RequestHandler } from "express";
import { z } from "zod";
import { createSchema, deleteSchema, getSchemaOrThrow, listSchemas } from "../services/schema.service.js";

const fieldDefinitionSchema: z.ZodTypeAny = z.lazy(() =>
  z.object({
    type: z.enum(["string", "number", "boolean", "enum", "array", "object"]),
    required: z.boolean().optional(),
    description: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    values: z.array(z.string()).optional(),
    items: z.union([z.enum(["string", "number", "boolean", "object"]), fieldDefinitionSchema]).optional(),
    fields: z.record(fieldDefinitionSchema).optional()
  }).superRefine((field, ctx) => {
    if (field.min !== undefined && field.max !== undefined && field.min > field.max) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "min cannot be greater than max.", path: ["min"] });
    }
    if ((field.min !== undefined || field.max !== undefined) && !["string", "number"].includes(field.type)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "min/max constraints are only supported for string and number fields.", path: ["min"] });
    }
    if (field.type === "enum" && (!field.values || field.values.length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enum fields must include at least one value.", path: ["values"] });
    }
    if (field.type === "array" && !field.items) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Array fields must include an items definition.", path: ["items"] });
    }
    if (field.type === "array" && field.items === "object") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Array items cannot be a bare object. Provide a nested object definition with fields.", path: ["items"] });
    }
    if (field.type === "object" && (!field.fields || Object.keys(field.fields).length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Object fields must include nested fields.", path: ["fields"] });
    }
  })
);

const schemaRequest = z.object({
  name: z.string().min(2).regex(/^[a-zA-Z0-9_-]+$/, "Use only letters, numbers, underscores, and hyphens."),
  description: z.string().optional(),
  schema: z.record(fieldDefinitionSchema).refine((value) => Object.keys(value).length > 0, "Schema must contain at least one field.")
});

export const createSchemaController: RequestHandler = async (req, res, next) => {
  try {
    const input = schemaRequest.parse(req.body);
    const schema = await createSchema(input);
    res.status(201).json({ success: true, schema });
  } catch (error) {
    next(error);
  }
};

export const listSchemasController: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ success: true, schemas: await listSchemas() });
  } catch (error) {
    next(error);
  }
};

export const getSchemaController: RequestHandler = async (req, res, next) => {
  try {
    res.json({ success: true, schema: await getSchemaOrThrow(req.params.name) });
  } catch (error) {
    next(error);
  }
};

export const deleteSchemaController: RequestHandler = async (req, res, next) => {
  try {
    await deleteSchema(req.params.name);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
