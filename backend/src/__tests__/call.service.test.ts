import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/prisma.js", () => ({
  prisma: {
    schemaDefinition: { findUnique: vi.fn() },
    failureLog: { create: vi.fn() },
    lLMCall: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() }
  }
}));

vi.mock("../services/llm.service.js", () => ({
  callLLM: vi.fn()
}));

import { prisma } from "../db/prisma.js";
import { callLLM } from "../services/llm.service.js";
import { runValidatedCall } from "../services/call.service.js";

const schemaJson = {
  vendorName: { type: "string", required: true },
  amount: { type: "number", required: true },
  currency: { type: "enum", values: ["INR", "USD"], required: true }
};

describe("runValidatedCall", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.schemaDefinition.findUnique).mockResolvedValue({
      id: "schema-1",
      name: "invoice_extraction",
      description: "Invoice schema",
      schemaJson: JSON.stringify(schemaJson),
      difficulty: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    vi.mocked(prisma.lLMCall.create).mockImplementation(async ({ data }: any) => ({
      id: "call-1",
      ...data,
      createdAt: new Date(),
      attempts: data.attempts.create.map((attempt: any, index: number) => ({
        id: `attempt-${index + 1}`,
        callId: "call-1",
        createdAt: new Date(),
        ...attempt
      }))
    }));
  });

  it("retries after a failed validation and returns only the validated output", async () => {
    vi.mocked(callLLM)
      .mockResolvedValueOnce({
        text: '{"vendorName":"ABC Pvt Ltd","amount":"₹5000","currency":"Rupees"}',
        tokenUsage: { promptTokens: 10, completionTokens: 8, totalTokens: 18 }
      })
      .mockResolvedValueOnce({
        text: '{"vendorName":"ABC Pvt Ltd","amount":5000,"currency":"INR"}',
        tokenUsage: { promptTokens: 12, completionTokens: 7, totalTokens: 19 }
      });

    const result = await runValidatedCall({
      schemaName: "invoice_extraction",
      prompt: "Extract invoice data from {{invoiceText}}",
      variables: { invoiceText: "ABC Pvt Ltd invoice total is ₹5000" },
      strategy: "few_shot",
      maxAttempts: 3
    });

    expect(result.success).toBe(true);
    expect(result.attemptCount).toBe(2);
    expect(result.correctionNeeded).toBe(true);
    expect(result.validatedOutput).toEqual({ vendorName: "ABC Pvt Ltd", amount: 5000, currency: "INR" });
    expect(prisma.failureLog.create).toHaveBeenCalledTimes(1);
  });

  it("returns a structured failure after all retry attempts are exhausted", async () => {
    vi.mocked(callLLM)
      .mockResolvedValueOnce({ text: "not json", tokenUsage: { promptTokens: 4, completionTokens: 2, totalTokens: 6 } })
      .mockResolvedValueOnce({ text: '{"vendorName":"ABC","amount":"wrong","currency":"Rupees"}', tokenUsage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 } })
      .mockResolvedValueOnce({ text: '{"vendorName":"ABC"}', tokenUsage: { promptTokens: 5, completionTokens: 2, totalTokens: 7 } });

    const result = await runValidatedCall({
      schemaName: "invoice_extraction",
      prompt: "Extract invoice data from {{invoiceText}}",
      variables: { invoiceText: "force_all_attempts_fail" },
      strategy: "json_instruction",
      maxAttempts: 3
    });

    expect(result.success).toBe(false);
    expect(result.attemptCount).toBe(3);
    expect(result.message).toContain("Validation failed after 3 attempt");
    expect(result.attempts).toHaveLength(3);
    expect(prisma.failureLog.create).toHaveBeenCalledTimes(3);
  });

});
