const PARSE_FAILED = Symbol("parse_failed");

function tryParse(candidate: string): unknown | typeof PARSE_FAILED {
  try {
    return JSON.parse(candidate.trim());
  } catch {
    return PARSE_FAILED;
  }
}

function extractBalancedJson(raw: string, open: "{" | "[", close: "}" | "]"): unknown | typeof PARSE_FAILED {
  const starts = [...raw].map((char, index) => (char === open ? index : -1)).filter((index) => index >= 0);

  for (const start of starts) {
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < raw.length; i += 1) {
      const char = raw[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\" && inString) {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === open) depth += 1;
      if (char === close) depth -= 1;

      if (depth === 0) {
        const parsed = tryParse(raw.slice(start, i + 1));
        if (parsed !== PARSE_FAILED) return parsed;
        break;
      }
    }
  }

  return PARSE_FAILED;
}

export function extractJson(raw: string): unknown {
  const trimmed = raw.trim();

  const direct = tryParse(trimmed);
  if (direct !== PARSE_FAILED) return direct;

  const codeBlocks = [...trimmed.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
  for (const block of codeBlocks) {
    const parsed = tryParse(block[1]);
    if (parsed !== PARSE_FAILED) return parsed;
  }

  const firstObject = trimmed.indexOf("{");
  const firstArray = trimmed.indexOf("[");
  const objectFirst = firstObject >= 0 && (firstArray < 0 || firstObject < firstArray);

  const candidates = objectFirst
    ? [["{", "}"], ["[", "]"]]
    : [["[", "]"], ["{", "}"]];

  for (const [open, close] of candidates as Array<["{" | "[", "}" | "]"]>) {
    const parsed = extractBalancedJson(trimmed, open, close);
    if (parsed !== PARSE_FAILED) return parsed;
  }

  throw new Error("Unable to extract valid JSON from the LLM response.");
}
