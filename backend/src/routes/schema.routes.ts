import { Router } from "express";
import { createSchemaController, deleteSchemaController, getSchemaController, listSchemasController } from "../controllers/schema.controller.js";

export const schemaRoutes = Router();

schemaRoutes.post("/", createSchemaController);
schemaRoutes.get("/", listSchemasController);
schemaRoutes.get("/:name", getSchemaController);
schemaRoutes.delete("/:name", deleteSchemaController);
