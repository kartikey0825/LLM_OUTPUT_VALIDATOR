import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/appError.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Request validation failed.",
      issues: err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
    });
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error"
  });
};
