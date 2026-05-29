import type { SchemaDefinition } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { AppError } from "../utils/appError.js";
import { calculateSchemaDifficulty, buildZodSchema } from "../utils/zodBuilder.js";
import { fromJsonString, toJsonString } from "../utils/storageJson.js";
import type { SchemaShape } from "../types/schema.js";

export type HydratedSchemaDefinition = Omit<SchemaDefinition, "schemaJson"> & { schemaJson: SchemaShape };

function hydrateSchema(schema: SchemaDefinition): HydratedSchemaDefinition {
  return {
    ...schema,
    schemaJson: fromJsonString<SchemaShape>(schema.schemaJson, {}) ?? {}
  };
}

export async function createSchema(input: { name: string; description?: string; schema: SchemaShape }) {
  buildZodSchema(input.schema);
  const difficulty = calculateSchemaDifficulty(input.schema);
  const schemaJson = toJsonString(input.schema) ?? "{}";

  const schema = await prisma.schemaDefinition.upsert({
    where: { name: input.name },
    update: { description: input.description, schemaJson, difficulty },
    create: { name: input.name, description: input.description, schemaJson, difficulty }
  });

  return hydrateSchema(schema);
}

export async function getSchemaOrThrow(name: string) {
  const schema = await prisma.schemaDefinition.findUnique({ where: { name } });
  if (!schema) throw new AppError(`Schema '${name}' was not found.`, 404);
  return hydrateSchema(schema);
}

export async function listSchemas() {
  const schemas = await prisma.schemaDefinition.findMany({ orderBy: { createdAt: "desc" } });
  return schemas.map(hydrateSchema);
}

export async function deleteSchema(name: string) {
  await getSchemaOrThrow(name);
  const relatedCalls = await prisma.lLMCall.count({ where: { schemaName: name } });

  if (relatedCalls > 0) {
    throw new AppError(
      `Schema '${name}' has ${relatedCalls} previous validation call(s). It is kept for audit safety and cannot be deleted.`,
      409
    );
  }

  return prisma.schemaDefinition.delete({ where: { name } });
}
