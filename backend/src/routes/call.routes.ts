import { Router } from "express";
import { getCallController, listCallsController, runCallController } from "../controllers/call.controller.js";

export const callRoutes = Router();

callRoutes.post("/call", runCallController);
callRoutes.get("/calls", listCallsController);
callRoutes.get("/calls/:id", getCallController);
