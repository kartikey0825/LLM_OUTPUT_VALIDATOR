export function renderPromptTemplate(prompt: string, variables?: Record<string, unknown>): string {
  if (!variables || Object.keys(variables).length === 0) return prompt;

  return Object.entries(variables).reduce((rendered, [key, value]) => {
    const token = new RegExp(`{{\\s*${escapeRegExp(key)}\\s*}}`, "g");
    return rendered.replace(token, stringifyVariable(value));
  }, prompt);
}

function stringifyVariable(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function findUnresolvedVariables(prompt: string): string[] {
  const matches = prompt.match(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g) ?? [];
  return [...new Set(matches.map((match) => match.replace(/[{}]/g, "").trim()))];
}
