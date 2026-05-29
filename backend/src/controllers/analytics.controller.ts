import type { RequestHandler } from "express";
import { getFailures, getMetrics } from "../services/analytics.service.js";

export const failuresController: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ success: true, ...(await getFailures()) });
  } catch (error) {
    next(error);
  }
};

export const metricsController: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ success: true, ...(await getMetrics()) });
  } catch (error) {
    next(error);
  }
};
