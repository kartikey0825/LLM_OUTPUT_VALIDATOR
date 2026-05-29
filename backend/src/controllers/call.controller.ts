import type { RequestHandler } from "express";
import { z } from "zod";
import { getCall, listCalls, runValidatedCall } from "../services/call.service.js";
import { AppError } from "../utils/appError.js";

const callRequest = z.object({
  schemaName: z.string().min(1),
  prompt: z.string().min(5),
  variables: z.record(z.unknown()).optional().default({}),
  model: z.string().optional(),
  strategy: z.enum(["json_instruction", "few_shot", "function_calling"]).optional(),
  maxAttempts: z.number().int().min(1).max(3).optional(),
  safeMode: z.boolean().optional(),
  partialRecovery: z.boolean().optional()
});

export const runCallController: RequestHandler = async (req, res, next) => {
  try {
    const input = callRequest.parse(req.body);
    const result = await runValidatedCall(input);
    res.status(result.success ? 200 : 422).json(result);
  } catch (error) {
    next(error);
  }
};

export const listCallsController: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ success: true, calls: await listCalls() });
  } catch (error) {
    next(error);
  }
};

export const getCallController: RequestHandler = async (req, res, next) => {
  try {
    const call = await getCall(req.params.id);
    if (!call) throw new AppError("Call not found", 404);
    res.json({ success: true, call });
  } catch (error) {
    next(error);
  }
};
