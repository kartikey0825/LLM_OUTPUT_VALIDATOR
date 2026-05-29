import { describe, expect, it } from "vitest";
import { findUnresolvedVariables, renderPromptTemplate } from "../utils/promptRenderer.js";

describe("promptRenderer", () => {
  it("renders simple template variables", () => {
    const rendered = renderPromptTemplate("Extract from {{ invoiceText }}", { invoiceText: "Invoice INV-101" });
    expect(rendered).toBe("Extract from Invoice INV-101");
  });

  it("renders object variables as formatted JSON", () => {
    const rendered = renderPromptTemplate("Use {{payload}}", { payload: { amount: 5000, currency: "INR" } });
    expect(rendered).toContain('"amount": 5000');
    expect(rendered).toContain('"currency": "INR"');
  });

  it("detects unresolved variables", () => {
    expect(findUnresolvedVariables("Extract {{missing}} and {{ another_one }}")).toEqual(["missing", "another_one"]);
  });
});
