import { describe, expect, it } from "vitest";
import { extractJson } from "../utils/jsonExtractor.js";

describe("extractJson", () => {
  it("extracts plain JSON", () => {
    expect(extractJson('{"name":"Amit","score":90}')).toEqual({ name: "Amit", score: 90 });
  });

  it("extracts JSON from markdown code fences", () => {
    expect(extractJson('Here it is:\n```json\n{"amount":5000}\n```')).toEqual({ amount: 5000 });
  });

  it("extracts JSON from text before and after the object", () => {
    expect(extractJson('Some explanation {"ok":true,"items":[1,2]} done.')).toEqual({ ok: true, items: [1, 2] });
  });

  it("extracts array JSON", () => {
    expect(extractJson('Result: [{"a":1},{"a":2}]')).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it("throws on invalid JSON", () => {
    expect(() => extractJson("not json at all")).toThrow();
  });
});
