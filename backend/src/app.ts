import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { schemaRoutes } from "./routes/schema.routes.js";
import { callRoutes } from "./routes/call.routes.js";
import { analyticsRoutes } from "./routes/analytics.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin === "*" ? true : env.corsOrigin }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "LLM_OUTPUT_VALIDATOR API is running", version: "1.1.0" });
});

app.use("/api/schemas", schemaRoutes);
app.use("/api", callRoutes);
app.use("/api", analyticsRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);
