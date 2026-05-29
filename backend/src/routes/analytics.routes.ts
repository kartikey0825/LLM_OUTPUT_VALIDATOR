import { Router } from "express";
import { failuresController, metricsController } from "../controllers/analytics.controller.js";

export const analyticsRoutes = Router();

analyticsRoutes.get("/failures", failuresController);
analyticsRoutes.get("/metrics", metricsController);
